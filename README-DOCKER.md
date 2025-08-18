# InstaFlow Docker環境構築ガイド

## 必要なソフトウェア

- Docker Desktop (Windows/Mac/Linux)
- Node.js 20+ (ローカル開発用)

## セットアップ手順

### 1. Docker Desktopのインストール

[Docker Desktop](https://www.docker.com/products/docker-desktop)をダウンロードしてインストールしてください。

### 2. 環境変数の設定

`.env.local`ファイルを作成し、必要な環境変数を設定してください：

```bash
cp .env.local.example .env.local
# .env.localを編集して実際の値を設定
```

### 3. Docker環境の起動

```bash
# 開発環境の起動
docker-compose up -d

# またはバックグラウンドで起動
docker-compose up -d

# ログの確認
docker-compose logs -f app
```

### 4. データベースの確認

pgAdminにアクセス：
- URL: http://localhost:5050
- Email: admin@instaflow.com
- Password: admin

データベース接続情報：
- Host: db
- Port: 5432
- Database: instaflow
- Username: postgres
- Password: postgres

## よく使うDockerコマンド

```bash
# サービスの起動
docker-compose up -d

# サービスの停止
docker-compose down

# サービスの再起動
docker-compose restart

# ログの確認
docker-compose logs -f [service_name]

# コンテナに入る
docker-compose exec app sh

# データベースに接続
docker-compose exec db psql -U postgres -d instaflow

# ビルドし直す
docker-compose build --no-cache

# ボリュームも含めて削除
docker-compose down -v
```

## トラブルシューティング

### ポートが使用中の場合

```bash
# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID [PID番号] /F
```

### Dockerのリセット

```bash
# すべてを停止して削除
docker-compose down -v
docker system prune -a
```

## 開発フロー

1. ローカルでコード変更
2. ホットリロードで自動反映
3. `docker-compose logs -f app`でログ確認
4. 必要に応じてコンテナ再起動

## 本番環境へのデプロイ

```bash
# 本番用イメージのビルド
docker build -t instaflow:latest .

# 本番環境での起動
docker run -p 3000:3000 --env-file .env.production instaflow:latest
```
