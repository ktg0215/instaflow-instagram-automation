import { NextResponse } from 'next/server'
import axios from 'axios'
import { InstagramService } from '@/services/instagramService'

type StatusResponse = {
  tokenConfigured: boolean
  tokenValid: boolean
  remainingDays: number | null
  instagramConnected: boolean
  profile?: {
    id: string
    username: string
    account_type: string
    media_count: number
    followers_count?: number
  }
  error?: string
}

export async function GET() {
  try {
    // 基本ステータス（サービスの接続テストを利用）
    const connection = await InstagramService.testConnection()

    // トークン残日数の推定（App Access Token がある場合のみ）
    const appAccessToken =
      process.env.FACEBOOK_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ACCESS_TOKEN ||
      null

    let remainingDays: number | null = null

    // サービスから現在のトークン文字列を取得する手段は公開していないため
    // debug_token は App Access Token が設定済みのときのみ実行
    if (appAccessToken) {
      try {
        // 軽量な検証のため、/me エンドポイントで使ったトークンをサイドチャネルで再取得できないため
        // InstagramService.validateAccessToken() の前提に従い、環境変数/LocalStorage から読まれるトークンでそのまま検証する
        // サーバー側では環境変数から参照される
        const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN
        if (accessToken) {
          const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`
          const { data } = await axios.get(debugUrl)
          const expiresAt = data?.data?.expires_at as number | undefined
          if (expiresAt) {
            const nowSec = Math.floor(Date.now() / 1000)
            const diffSec = expiresAt - nowSec
            remainingDays = Math.max(0, Math.floor(diffSec / 86400))
          }
        }
      } catch (e) {
        // 残日数は任意情報のため、取得失敗は無視
        remainingDays = null
      }
    }

    const body: StatusResponse = {
      tokenConfigured: connection.tokenValid || !!process.env.INSTAGRAM_ACCESS_TOKEN || !!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN,
      tokenValid: connection.tokenValid,
      remainingDays,
      instagramConnected: connection.instagramConnected,
      profile: connection.profile,
      error: connection.error,
    }

    return NextResponse.json(body, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        tokenConfigured: !!(process.env.INSTAGRAM_ACCESS_TOKEN || process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN),
        tokenValid: false,
        remainingDays: null,
        instagramConnected: false,
        error: error?.message || 'Unknown error',
      } satisfies StatusResponse,
      { status: 200 }
    )
  }
}


