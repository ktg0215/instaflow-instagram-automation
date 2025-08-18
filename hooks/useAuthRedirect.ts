'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useInstagram } from './useInstagram'

export const useAuthRedirect = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { isConnected: isInstagramConnected, isLoading: instagramLoading } = useInstagram(user?.id ? String(user.id) : undefined)

  useEffect(() => {
    if (loading || instagramLoading) return

    // ユーザーがログインしている場合のルーティング
    const currentPath = window.location.pathname

    if (user) {
      // ユーザーがログインしていて、ホームページにいる場合のみリダイレクト
      if (currentPath === '/') {
        if (user.role === 'admin') {
          // 管理者の場合は常にダッシュボードへ
          router.replace('/dashboard')
        } else {
          // 一般ユーザーの場合
          if (!isInstagramConnected) {
            // Instagram連携されていない場合は設定画面へ
            router.replace('/settings')
          } else {
            // 連携済みの場合はダッシュボードへ
            router.replace('/dashboard')
          }
        }
      }
    }
    // ユーザーがログインしていない場合は何もしない（ホームページに留まる）
  }, [user, loading, isInstagramConnected, instagramLoading, router])

  return { user, loading: loading || instagramLoading }
}