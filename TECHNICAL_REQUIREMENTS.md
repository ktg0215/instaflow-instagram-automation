# InstaFlow - Technical Requirements

**🚨 重要**: この技術要件は確定版です。コードを変更する前に必ずこのファイルを確認してください。

## 🔐 認証システム要件 (確定)

### ✅ 使用技術: NextAuth v5 (Auth.js)
```json
// package.json での確定依存関係
{
  "next-auth": "^5.0.0-beta.29",
  "@auth/prisma-adapter": "^2.10.0",
  "@prisma/client": "^6.14.0"
}
```

### 📂 NextAuth必須ファイル構成
- `✅ /lib/auth.ts` - NextAuth設定ファイル
- `✅ /app/api/auth/[...nextauth]/route.ts` - NextAuth APIルート
- `✅ /middleware.ts` - NextAuth認証ミドルウェア
- `✅ /context/AuthContext.tsx` - NextAuthセッションラッパー
- `✅ /components/Providers.tsx` - SessionProvider設定

### 🚫 削除済み・使用禁止
- ❌ `jsonwebtoken` パッケージ - 削除済み
- ❌ `@types/jsonwebtoken` - 削除済み
- ❌ `/lib/jwt-middleware.ts` - 削除済み
- ❌ カスタムJWT実装 - 全て削除済み
- ❌ 手動トークン管理 - 禁止

## 🏗️ アーキテクチャ要件 (変更禁止)

### 📦 確定依存関係 (package.json)
```json
{
  "dependencies": {
    "next": "15.4.6",
    "react": "19.1.0", 
    "react-dom": "19.1.0",
    "next-auth": "^5.0.0-beta.29",
    "@auth/prisma-adapter": "^2.10.0",
    "@prisma/client": "^6.14.0",
    "@tanstack/react-query": "^5.84.1",
    "@google/generative-ai": "^0.24.1",
    "pg": "^8.16.3",
    "bcryptjs": "^3.0.2",
    "tailwindcss": "^4",
    "lucide-react": "^0.537.0",
    "axios": "^1.11.0",
    "date-fns": "^4.1.0",
    "recharts": "^3.1.2",
    "server-only": "^0.0.1"
  }
}
```

### 🔧 技術スタック詳細
- **📱 フレームワーク**: Next.js 15.4.6 + App Router
- **⚛️ UI ライブラリ**: React 19.1.0
- **📝 言語**: TypeScript 5.x
- **🗃️ データベース**: PostgreSQL (直接SQL、**ORM使用禁止**)
- **🔐 認証**: NextAuth v5 (Auth.js)
- **📊 状態管理**: React Query + React Context
- **🎨 スタイリング**: Tailwind CSS 4.x
- **🔲 アイコン**: Lucide React
- **🤖 AI**: Google Gemini 1.5-flash
- **🐳 コンテナ**: Docker + Docker Compose

### NextAuth v5 設定要件

#### 1. 依存関係
```json
{
  "next-auth": "5.0.0-beta.29",
  "@auth/prisma-adapter": "^2.10.0"
}
```

#### 2. ファイル構成
- `/lib/auth.ts` - NextAuth設定
- `/app/api/auth/[...nextauth]/route.ts` - NextAuth API routes
- `/middleware.ts` - NextAuth middleware
- `/context/AuthContext.tsx` - NextAuth session wrapper

#### 3. Database Schema
```sql
-- NextAuth required tables
CREATE TABLE accounts (...);
CREATE TABLE sessions (...);
CREATE TABLE users (...);
CREATE TABLE verification_tokens (...);
```

#### 4. Environment Variables
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
AUTH_SECRET=your-secret-key  # NextAuth v5

# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/instaflow
```

## 開発ワークフロー要件

### Docker優先
- 全ての開発はDockerコンテナ内で実行
- ホットリロード対応
- データベースも含めたフルスタック環境

### ポート設定
- アプリケーション: `localhost:3010`
- PostgreSQL: `localhost:5432`
- pgAdmin: `localhost:5050`

### テストアカウント
- Admin: `ktg.shota@gmail.com` / `ktg19850215`
- Test: `test@example.com` / `test123`

## 機能要件

### 認証機能
- ✅ Email/Password ログイン (NextAuth)
- ✅ セッション管理 (NextAuth)
- ✅ ミドルウェア保護ルート
- ✅ 自動リダイレクト処理

### 保護対象ルート
- `/dashboard` - メインダッシュボード
- `/create` - 投稿作成
- `/schedule` - スケジュール管理
- `/analytics` - 分析画面
- `/settings` - 設定画面
- `/ai` - AI機能

### パブリックルート
- `/` - ランディングページ
- `/login` - ログインページ
- `/signup` - サインアップページ

## データベース要件

### 接続設定
- **接続プール**: Singleton pattern
- **ヘルスチェック**: `/api/health/db`
- **接続文字列**: `DATABASE_URL` 環境変数

### セキュリティ要件
- パスワードハッシュ: bcrypt (10 rounds)
- SQL injection protection
- Input validation & sanitization

## 外部サービス統合

### Instagram API
- Mock development mode
- Graph API v23.0
- アクセストークン管理

### Google Gemini AI
- Model: `gemini-1.5-flash`
- API Key: `NEXT_PUBLIC_GOOGLE_AI_API_KEY`
- Content generation

## Build & Deploy Requirements

### Scripts
```bash
npm run dev     # Development server
npm run build   # Production build
npm run start   # Production server
npm run lint    # ESLint
npm run test    # Jest tests
```

### Docker Commands
```bash
docker-compose up -d                              # All services
docker-compose -f docker-compose.dev.yml up -d   # Development
docker-compose restart app                       # Restart app
```

---

**変更履歴**:
- 2025-08-19: 初回作成、NextAuth v5要件を確定
- この要件に従って一貫した実装を行うこと