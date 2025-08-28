import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/services/postService'
import { verifyAuth } from '@/lib/auth'
import { WebSocketEmitter } from '@/lib/websocket'

interface BatchOperation {
  operation: 'create' | 'update' | 'delete' | 'publish' | 'schedule'
  data: any
  id?: string
}

interface BatchRequest {
  operations: BatchOperation[]
  transactional?: boolean // If true, all operations succeed or all fail
  notify?: boolean // Send WebSocket notifications
}

interface BatchResult {
  operationId: number
  operation: string
  success: boolean
  data?: any
  error?: string
  timestamp: string
}

interface BatchResponse {
  totalOperations: number
  successful: number
  failed: number
  results: BatchResult[]
  transactionId: string
  processingTime: number
}

// Transaction management for batch operations
class BatchTransaction {
  private operations: Array<{ rollback: () => Promise<void> }> = []
  
  addRollback(rollbackFn: () => Promise<void>) {
    this.operations.push({ rollback: rollbackFn })
  }
  
  async rollbackAll() {
    console.log('🔄 Rolling back batch transaction...')
    for (const op of this.operations.reverse()) {
      try {
        await op.rollback()
      } catch (error) {
        console.error('❌ Rollback failed:', error)
      }
    }
    this.operations = []
  }
  
  clear() {
    this.operations = []
  }
}

// Rate limiting for batch operations
const batchRateLimit = new Map<string, { count: number; lastReset: number }>()
const MAX_BATCH_OPERATIONS = 50
const MAX_BATCHES_PER_HOUR = 10

function checkBatchRateLimit(userId: string, operationsCount: number): { allowed: boolean; reason?: string } {
  if (operationsCount > MAX_BATCH_OPERATIONS) {
    return { allowed: false, reason: `一度に実行できる操作は${MAX_BATCH_OPERATIONS}件までです` }
  }
  
  const now = Date.now()
  const userRequests = batchRateLimit.get(userId)
  
  if (!userRequests) {
    batchRateLimit.set(userId, { count: 1, lastReset: now })
    return { allowed: true }
  }
  
  if (now - userRequests.lastReset > 3600000) { // 1 hour
    userRequests.count = 1
    userRequests.lastReset = now
    return { allowed: true }
  }
  
  if (userRequests.count < MAX_BATCHES_PER_HOUR) {
    userRequests.count++
    return { allowed: true }
  }
  
  return { allowed: false, reason: '1時間あたりのバッチ処理制限に達しました' }
}

// Execute individual operation
async function executeOperation(
  operation: BatchOperation,
  userId: string,
  transaction: BatchTransaction
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (operation.operation) {
      case 'create':
        const createData = {
          user_id: userId,
          caption: operation.data.caption,
          image_url: operation.data.image_url || null,
          status: operation.data.status || 'draft',
          scheduled_at: operation.data.status === 'scheduled' ? operation.data.scheduled_at : null
        }
        
        const createdPost = await PostService.createPost(createData)
        
        // Add rollback
        transaction.addRollback(async () => {
          await PostService.deletePost(createdPost.id)
        })
        
        return { success: true, data: createdPost }
      
      case 'update':
        if (!operation.id) {
          return { success: false, error: '更新にはIDが必要です' }
        }
        
        // Get original post for rollback
        const originalPost = await PostService.getPostById(operation.id)
        if (!originalPost) {
          return { success: false, error: '投稿が見つかりません' }
        }
        
        const updatedPost = await PostService.updatePost(operation.id, operation.data)
        
        // Add rollback
        transaction.addRollback(async () => {
          await PostService.updatePost(operation.id!, {
            caption: originalPost.caption,
            image_url: originalPost.image_url,
            status: originalPost.status,
            scheduled_at: originalPost.scheduled_at
          })
        })
        
        return { success: true, data: updatedPost }
      
      case 'delete':
        if (!operation.id) {
          return { success: false, error: '削除にはIDが必要です' }
        }
        
        // Get post data for rollback
        const postToDelete = await PostService.getPostById(operation.id)
        if (!postToDelete) {
          return { success: false, error: '投稿が見つかりません' }
        }
        
        await PostService.deletePost(operation.id)
        
        // Add rollback
        transaction.addRollback(async () => {
          await PostService.createPost({
            user_id: postToDelete.user_id,
            caption: postToDelete.caption,
            image_url: postToDelete.image_url,
            status: postToDelete.status,
            scheduled_at: postToDelete.scheduled_at
          })
        })
        
        return { success: true, data: { id: operation.id, deleted: true } }
      
      case 'publish':
        if (!operation.id) {
          return { success: false, error: '公開にはIDが必要です' }
        }
        
        const publishedPost = await PostService.publishPost(operation.id)
        
        // Add rollback (revert to previous status)
        transaction.addRollback(async () => {
          await PostService.updatePost(operation.id!, { status: 'draft' })
        })
        
        return { success: true, data: publishedPost }
      
      case 'schedule':
        if (!operation.id) {
          return { success: false, error: 'スケジュールにはIDが必要です' }
        }
        
        if (!operation.data.scheduled_at) {
          return { success: false, error: 'スケジュール時間が必要です' }
        }
        
        const scheduledPost = await PostService.updatePost(operation.id, {
          status: 'scheduled',
          scheduled_at: operation.data.scheduled_at
        })
        
        // Add rollback
        transaction.addRollback(async () => {
          await PostService.updatePost(operation.id!, { status: 'draft', scheduled_at: null })
        })
        
        return { success: true, data: scheduledPost }
      
      default:
        return { success: false, error: `未対応の操作: ${operation.operation}` }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const userId = String(user.id)
    const body: BatchRequest = await request.json().catch(() => ({ operations: [] }))
    
    const { operations = [], transactional = false, notify = true } = body
    
    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json({ 
        error: '操作の配列が必要です' 
      }, { status: 400 })
    }
    
    // Check rate limits
    const rateLimitCheck = checkBatchRateLimit(userId, operations.length)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ 
        error: rateLimitCheck.reason 
      }, { status: 429 })
    }
    
    const transactionId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const transaction = new BatchTransaction()
    const results: BatchResult[] = []
    
    let successful = 0
    let failed = 0
    
    console.log(`🚀 Starting batch operation ${transactionId} with ${operations.length} operations`)
    
    // Process operations
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i]
      const operationStart = Date.now()
      
      try {
        const result = await executeOperation(operation, userId, transaction)
        
        const batchResult: BatchResult = {
          operationId: i,
          operation: operation.operation,
          success: result.success,
          data: result.data,
          error: result.error,
          timestamp: new Date().toISOString()
        }
        
        results.push(batchResult)
        
        if (result.success) {
          successful++
          
          // Send WebSocket notification for successful operations
          if (notify) {
            switch (operation.operation) {
              case 'create':
                WebSocketEmitter.notifyPostCreated(
                  userId,
                  result.data.id,
                  result.data.status,
                  result.data.caption
                )
                break
              case 'publish':
                WebSocketEmitter.notifyPostPublished(userId, result.data.id)
                break
            }
          }
        } else {
          failed++
          
          // If transactional and any operation fails, rollback all
          if (transactional) {
            console.log(`❌ Operation ${i} failed, rolling back transaction`)
            await transaction.rollbackAll()
            
            return NextResponse.json({
              error: 'トランザクションが失敗しました。すべての変更をロールバックしました。',
              failedOperation: batchResult,
              transactionId
            }, { status: 400 })
          }
        }
        
        console.log(`✅ Operation ${i} (${operation.operation}) completed in ${Date.now() - operationStart}ms`)
        
      } catch (error: any) {
        failed++
        const batchResult: BatchResult = {
          operationId: i,
          operation: operation.operation,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
        
        results.push(batchResult)
        
        if (transactional) {
          console.log(`❌ Operation ${i} failed, rolling back transaction`)
          await transaction.rollbackAll()
          
          return NextResponse.json({
            error: 'トランザクションが失敗しました。すべての変更をロールバックしました。',
            failedOperation: batchResult,
            transactionId
          }, { status: 400 })
        }
      }
    }
    
    // Clear transaction if not rolled back
    if (!transactional || failed === 0) {
      transaction.clear()
    }
    
    const processingTime = Date.now() - startTime
    
    const response: BatchResponse = {
      totalOperations: operations.length,
      successful,
      failed,
      results,
      transactionId,
      processingTime
    }
    
    console.log(`🏁 Batch operation ${transactionId} completed: ${successful} successful, ${failed} failed in ${processingTime}ms`)
    
    // Send summary notification
    if (notify && operations.length > 1) {
      WebSocketEmitter.sendNotification(
        userId,
        failed === 0 ? 'success' : successful > 0 ? 'warning' : 'error',
        'バッチ処理完了',
        `${operations.length}件中${successful}件が正常に処理されました`
      )
    }
    
    return NextResponse.json(response, {
      status: failed === 0 ? 200 : 207, // 207 Multi-Status for partial success
      headers: {
        'X-Transaction-Id': transactionId,
        'X-Processing-Time': processingTime.toString(),
        'X-Batch-Success-Rate': `${(successful / operations.length * 100).toFixed(1)}%`
      }
    })
    
  } catch (error: any) {
    console.error('❌ Batch API Error:', error)
    return NextResponse.json({ 
      error: 'バッチ処理でエラーが発生しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET endpoint to check batch operation status
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const userId = String(user.id)
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    
    if (transactionId) {
      // In a real implementation, you'd store batch operation status in database
      // For now, return mock data
      return NextResponse.json({
        transactionId,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        summary: {
          totalOperations: 5,
          successful: 4,
          failed: 1
        }
      })
    }
    
    // Return batch operation capabilities and limits
    return NextResponse.json({
      capabilities: {
        maxOperationsPerBatch: MAX_BATCH_OPERATIONS,
        maxBatchesPerHour: MAX_BATCHES_PER_HOUR,
        supportedOperations: ['create', 'update', 'delete', 'publish', 'schedule'],
        transactionalSupport: true,
        notificationSupport: true
      },
      currentLimits: {
        userId,
        remainingBatches: MAX_BATCHES_PER_HOUR, // Would be calculated based on actual usage
        resetTime: new Date(Date.now() + 3600000).toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('❌ Batch Status API Error:', error)
    return NextResponse.json({ 
      error: 'バッチ処理状態の取得に失敗しました' 
    }, { status: 500 })
  }
}