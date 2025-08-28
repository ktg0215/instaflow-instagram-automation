import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

// Metadata API for pricing, plans, and app configuration
interface PlanMetadata {
  id: string
  name: string
  displayName: string
  price: {
    monthly: number
    yearly: number
    currency: string
  }
  limits: {
    postsPerMonth: number
    scheduledPosts: number
    aiGenerations: number
    instagramAccounts: number
    analyticsHistory: number // days
    storage: number // MB
  }
  features: {
    id: string
    name: string
    description: string
    included: boolean
    premium?: boolean
  }[]
  popular?: boolean
  recommended?: boolean
  color: string
  gradient: string
}

interface AppMetadata {
  version: string
  features: {
    webSocket: boolean
    realTimeUpdates: boolean
    batchOperations: boolean
    imageOptimization: boolean
    aiGeneration: boolean
    analytics: boolean
    scheduling: boolean
  }
  limits: {
    maxFileSize: number
    supportedFormats: string[]
    maxBatchSize: number
    rateLimits: {
      api: number
      uploads: number
      ai: number
    }
  }
  integrations: {
    instagram: {
      available: boolean
      apiVersion: string
      permissions: string[]
    }
    ai: {
      available: boolean
      provider: string
      model: string
    }
  }
}

// Plan configurations
const PLANS: PlanMetadata[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'フリープラン',
    price: { monthly: 0, yearly: 0, currency: 'JPY' },
    limits: {
      postsPerMonth: 10,
      scheduledPosts: 3,
      aiGenerations: 5,
      instagramAccounts: 1,
      analyticsHistory: 7,
      storage: 100
    },
    features: [
      { id: 'basic_posting', name: '基本投稿', description: '手動での投稿作成', included: true },
      { id: 'basic_scheduling', name: '投稿予約', description: '最大3件まで予約可能', included: true },
      { id: 'basic_analytics', name: '基本分析', description: '7日間の基本データ', included: true },
      { id: 'ai_generation', name: 'AI生成', description: '月5回まで利用可能', included: true },
      { id: 'advanced_analytics', name: '詳細分析', description: '30日間の詳細データ', included: false },
      { id: 'bulk_operations', name: '一括操作', description: 'バッチ処理機能', included: false },
      { id: 'priority_support', name: '優先サポート', description: '24時間以内対応', included: false }
    ],
    color: '#6B7280',
    gradient: 'from-gray-500 to-gray-600'
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'プロプラン',
    price: { monthly: 1980, yearly: 19800, currency: 'JPY' },
    limits: {
      postsPerMonth: 100,
      scheduledPosts: 50,
      aiGenerations: 100,
      instagramAccounts: 3,
      analyticsHistory: 30,
      storage: 1000
    },
    features: [
      { id: 'basic_posting', name: '基本投稿', description: '無制限の投稿作成', included: true },
      { id: 'advanced_scheduling', name: '高度な予約', description: '50件まで予約可能', included: true },
      { id: 'advanced_analytics', name: '詳細分析', description: '30日間の詳細データ', included: true },
      { id: 'ai_generation', name: 'AI生成', description: '月100回まで利用可能', included: true },
      { id: 'bulk_operations', name: '一括操作', description: 'バッチ処理機能', included: true },
      { id: 'image_optimization', name: '画像最適化', description: '自動リサイズ・圧縮', included: true },
      { id: 'priority_support', name: '優先サポート', description: '24時間以内対応', included: false }
    ],
    popular: true,
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'エンタープライズ',
    price: { monthly: 4980, yearly: 49800, currency: 'JPY' },
    limits: {
      postsPerMonth: -1, // unlimited
      scheduledPosts: -1, // unlimited
      aiGenerations: -1, // unlimited
      instagramAccounts: 10,
      analyticsHistory: 365,
      storage: 10000
    },
    features: [
      { id: 'unlimited_posting', name: '無制限投稿', description: '投稿数制限なし', included: true },
      { id: 'unlimited_scheduling', name: '無制限予約', description: '予約数制限なし', included: true },
      { id: 'advanced_analytics', name: '高度な分析', description: '1年間の詳細データ', included: true },
      { id: 'unlimited_ai', name: 'AI生成無制限', description: '無制限でAI利用可能', included: true },
      { id: 'bulk_operations', name: '一括操作', description: '高速バッチ処理', included: true },
      { id: 'image_optimization', name: '画像最適化', description: '高速処理・多形式対応', included: true },
      { id: 'priority_support', name: '優先サポート', description: '1時間以内対応', included: true },
      { id: 'custom_integrations', name: 'カスタム連携', description: 'API・Webhook対応', included: true, premium: true },
      { id: 'white_label', name: 'ホワイトラベル', description: 'ブランドカスタマイズ', included: true, premium: true }
    ],
    recommended: true,
    color: '#10B981',
    gradient: 'from-emerald-500 to-green-600'
  }
]

// App metadata configuration
const APP_METADATA: AppMetadata = {
  version: '2.0.0',
  features: {
    webSocket: true,
    realTimeUpdates: true,
    batchOperations: true,
    imageOptimization: true,
    aiGeneration: true,
    analytics: true,
    scheduling: true
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/mov'],
    maxBatchSize: 50,
    rateLimits: {
      api: 1000, // per hour
      uploads: 100, // per hour
      ai: 50 // per hour for free tier
    }
  },
  integrations: {
    instagram: {
      available: true,
      apiVersion: 'v18.0',
      permissions: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement']
    },
    ai: {
      available: true,
      provider: 'Google',
      model: 'gemini-1.5-flash'
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'plans', 'features', 'limits', 'app'
    const planId = searchParams.get('planId')
    
    // Return specific plan details
    if (planId) {
      const plan = PLANS.find(p => p.id === planId)
      if (!plan) {
        return NextResponse.json({ error: 'プランが見つかりません' }, { status: 404 })
      }
      
      return NextResponse.json({
        plan,
        billing: {
          monthlySavings: 0,
          yearlySavings: plan.price.monthly * 12 - plan.price.yearly,
          yearlyDiscount: plan.price.yearly > 0 ? 
            Math.round((1 - plan.price.yearly / (plan.price.monthly * 12)) * 100) : 0
        }
      })
    }
    
    // Return specific data type
    if (type === 'plans') {
      return NextResponse.json({
        plans: PLANS,
        defaultPlan: 'free',
        currency: 'JPY',
        billingCycles: ['monthly', 'yearly'],
        features: {
          comparison: PLANS[0].features.map(f => ({
            id: f.id,
            name: f.name,
            description: f.description,
            plans: PLANS.map(p => ({
              planId: p.id,
              included: p.features.find(pf => pf.id === f.id)?.included || false,
              premium: p.features.find(pf => pf.id === f.id)?.premium || false
            }))
          }))
        }
      })
    }
    
    if (type === 'app') {
      return NextResponse.json({
        app: APP_METADATA,
        server: {
          region: 'asia-northeast1',
          environment: process.env.NODE_ENV,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      })
    }
    
    if (type === 'features') {
      const user = await verifyAuth(request).catch(() => null)
      
      // Return features available to the current user
      const userPlan = user?.plan || 'free' // Assuming user has plan property
      const currentPlan = PLANS.find(p => p.id === userPlan) || PLANS[0]
      
      return NextResponse.json({
        currentPlan: currentPlan.id,
        availableFeatures: currentPlan.features.filter(f => f.included),
        limits: currentPlan.limits,
        usage: {
          // This would typically come from the database
          postsThisMonth: Math.floor(Math.random() * currentPlan.limits.postsPerMonth),
          aiGenerationsUsed: Math.floor(Math.random() * (currentPlan.limits.aiGenerations > 0 ? currentPlan.limits.aiGenerations : 100)),
          storageUsed: Math.floor(Math.random() * currentPlan.limits.storage)
        }
      })
    }
    
    // Return all metadata
    return NextResponse.json({
      plans: PLANS,
      app: APP_METADATA,
      api: {
        version: '2.0',
        endpoints: [
          '/api/v2/posts',
          '/api/v2/dashboard',
          '/api/v2/calendar',
          '/api/v2/batch',
          '/api/v2/preview',
          '/api/v2/media/optimize',
          '/api/v2/websocket'
        ],
        documentation: 'https://docs.your-domain.com/api/v2'
      },
      support: {
        email: 'support@your-domain.com',
        chat: true,
        phone: '+81-3-1234-5678',
        hours: 'Mon-Fri 9:00-18:00 JST'
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-API-Version': '2.0'
      }
    })
    
  } catch (error: any) {
    console.error('Metadata API Error:', error)
    return NextResponse.json({ 
      error: 'メタデータの取得に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}