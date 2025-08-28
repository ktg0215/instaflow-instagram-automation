# Backend Optimization Integration Guide

## 概要

このガイドでは、フロントエンド実装に最適化されたバックエンドAPIの統合方法を説明します。新しいAPIエンドポイントは、パフォーマンス、レスポンス時間、データ効率性を重視して設計されています。

## 新しいAPI構造

### 1. 最適化されたレスポンス形式

```typescript
interface OptimizedResponse<T> {
  data: T;
  metadata?: {
    optimized: boolean;
    compressed: boolean;
    fields: string | string[];
    include: string | string[];
  };
  optimization?: {
    compressed: boolean;
    compressionRatio?: string;
    cached: boolean;
    responseTime: number;
  };
}
```

### 2. APIエンドポイント

#### 基本投稿API (v2)
```bash
GET /api/v2/posts?fields=id,caption,status&include=engagement&compress=true
POST /api/v2/posts # バッチ作成対応
```

#### ダッシュボードAPI
```bash
GET /api/v2/dashboard?refresh=false
```

#### カレンダーAPI
```bash
GET /api/v2/calendar?year=2025&month=1
POST /api/v2/calendar # イベント作成
```

#### バッチ操作API
```bash
POST /api/v2/batch
GET /api/v2/batch?transactionId=xxx
```

#### 画像最適化API
```bash
POST /api/v2/media/optimize
```

#### プレビューAPI
```bash
POST /api/v2/preview
```

#### WebSocket API
```bash
GET /api/v2/websocket # 接続情報
POST /api/v2/websocket # 開発用イベント送信
```

#### メタデータAPI
```bash
GET /api/v2/metadata?type=plans
GET /api/v2/metadata?planId=pro
```

## フロントエンド統合

### 1. React Hooksの使用

```typescript
import { useOptimizedPosts, useDashboardData, useWebSocket } from '@/hooks/useOptimizedApi'

function Dashboard() {
  // 最適化されたダッシュボードデータ取得
  const { data: dashboardData, isLoading } = useDashboardData()
  
  // リアルタイム更新
  const { status, addEventListener } = useWebSocket()
  
  // 投稿データ（フィールド選択付き）
  const { posts, optimization } = useOptimizedPosts({
    fields: ['id', 'caption', 'status'],
    include: ['engagement'],
    compress: true
  })
  
  useEffect(() => {
    const cleanup = addEventListener('analytics:updated', (data) => {
      // リアルタイムでダッシュボード更新
    })
    
    return cleanup
  }, [])
}
```

### 2. バッチ操作の実装

```typescript
import { useBatchOperations } from '@/hooks/useOptimizedApi'

function BulkPostManager() {
  const { executeBatch, isProcessing } = useBatchOperations()
  
  const handleBulkPublish = async (postIds: string[]) => {
    const operations = postIds.map(id => ({
      operation: 'publish' as const,
      id
    }))
    
    await executeBatch({
      operations,
      transactional: true // すべて成功またはすべて失敗
    })
  }
}
```

### 3. 画像最適化の実装

```typescript
import { useImageOptimization } from '@/hooks/useOptimizedApi'

function ImageUpload() {
  const { optimizeImage, isOptimizing } = useImageOptimization()
  
  const handleFileUpload = async (file: File) => {
    try {
      const result = await optimizeImage(file, {
        format: 'webp',
        size: 'square',
        quality: 85,
        watermark: true
      })
      
      // result.optimizedUrl を使用
      // result.progressive で段階的読み込み対応
    } catch (error) {
      console.error('Optimization failed:', error)
    }
  }
}
```

### 4. WebSocket統合

```typescript
import { usePostEvents, useAnalyticsEvents } from '@/hooks/useWebSocket'

function RealTimeUpdates() {
  const { onPostCreated, onPostPublished } = usePostEvents()
  const { onAnalyticsUpdated } = useAnalyticsEvents()
  
  useEffect(() => {
    const cleanupPost = onPostCreated((data) => {
      console.log('New post created:', data)
      // UIを即座に更新
    })
    
    const cleanupAnalytics = onAnalyticsUpdated((data) => {
      console.log('Analytics updated:', data)
      // ダッシュボードをリアルタイム更新
    })
    
    return () => {
      cleanupPost()
      cleanupAnalytics()
    }
  }, [])
}
```

## パフォーマンス最適化

### 1. レスポンス圧縮

```typescript
// 自動的にレスポンスが圧縮され、10%以上の削減があった場合に
// X-Compression-Ratio ヘッダーが付与される
const response = await fetch('/api/v2/posts?compress=true')
const compressionRatio = response.headers.get('X-Compression-Ratio')
console.log(`Saved ${compressionRatio} bandwidth`)
```

### 2. フィールド選択

```typescript
// 必要なフィールドのみ取得でペイロード削減
const posts = await fetch('/api/v2/posts?fields=id,caption,status')

// 追加データが必要な場合のみinclude
const postsWithEngagement = await fetch('/api/v2/posts?include=engagement,instagram')
```

### 3. キャッシュ活用

```typescript
// ETagとCache-Controlヘッダーを活用した自動キャッシュ
// 304 Not Modifiedレスポンスで帯域幅削減
const cachedResponse = await fetch('/api/v2/dashboard', {
  headers: {
    'If-None-Match': lastEtag
  }
})
```

## エラーハンドリング

### 1. 一貫したエラー形式

```typescript
interface ApiError {
  error: string;
  details?: string; // 開発環境のみ
  code?: string;
  timestamp?: string;
}
```

### 2. レート制限対応

```typescript
// 429 Too Many Requestsのハンドリング
try {
  await fetch('/api/v2/media/optimize', { ... })
} catch (error) {
  if (error.status === 429) {
    // レート制限メッセージを表示
    // Retry-Afterヘッダーがあれば自動リトライ
  }
}
```

## モニタリングとデバッグ

### 1. パフォーマンスメトリクス

```typescript
import { useApiPerformance } from '@/hooks/useOptimizedApi'

function PerformanceMonitor() {
  const { metrics, recordMetrics } = useApiPerformance()
  
  return (
    <div>
      <p>平均レスポンス時間: {metrics.averageResponseTime}ms</p>
      <p>キャッシュヒット率: {metrics.cacheHitRate}%</p>
      <p>圧縮削減率: {metrics.compressionSavings}%</p>
    </div>
  )
}
```

### 2. レスポンスヘッダーでの診断

```typescript
// レスポンスヘッダーから最適化情報を取得
const headers = response.headers
console.log('Cache Status:', headers.get('X-Cache'))
console.log('Compression:', headers.get('X-Compression-Ratio'))
console.log('Processing Time:', headers.get('X-Processing-Time'))
```

## 移行ガイド

### 1. 既存APIから新APIへの移行

```typescript
// 旧API
const posts = await fetch('/api/posts')

// 新API（後方互換性あり）
const posts = await fetch('/api/v2/posts?fields=all&include=none')
```

### 2. 段階的移行戦略

1. **Phase 1**: 新APIエンドポイントを並行運用
2. **Phase 2**: フロントエンドを段階的に移行
3. **Phase 3**: パフォーマンスメトリクスを監視
4. **Phase 4**: 旧APIを廃止予定通知
5. **Phase 5**: 旧API完全廃止

## トラブルシューティング

### よくある問題と解決方法

1. **WebSocket接続失敗**
   - ファイアウォール設定を確認
   - プロキシ設定でWebSocketを許可

2. **画像最適化タイムアウト**
   - ファイルサイズを10MB以下に制限
   - 複数ファイルの場合は分割処理

3. **バッチ操作失敗**
   - トランザクション設定を確認
   - 操作数を50件以下に制限

4. **キャッシュ問題**
   - `?refresh=true`パラメーターで強制更新
   - ブラウザキャッシュをクリア

## セキュリティ考慮事項

1. **認証**: すべてのAPIエンドポイントでJWTトークン認証必須
2. **レート制限**: ユーザー別・エンドポイント別の制限
3. **入力検証**: すべての入力データの厳密な検証
4. **ファイルアップロード**: ウイルススキャンと形式チェック

## 今後の拡張予定

1. **GraphQLエンドポイント**: より柔軟なデータ取得
2. **CDN統合**: 静的コンテンツの高速配信
3. **Edge Computing**: レスポンス時間のさらなる短縮
4. **AI最適化**: 自動パフォーマンス調整