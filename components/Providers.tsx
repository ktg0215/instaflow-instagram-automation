'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分 - データの新鮮さを長く保持
            gcTime: 10 * 60 * 1000, // 10分 - キャッシュ保持時間を延長
            retry: 1, // リトライ回数を減らして高速化
            refetchOnWindowFocus: false, // ウィンドウフォーカス時のリフェッチを無効化
            refetchOnMount: false, // マウント時のリフェッチを無効化（必要に応じて）
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}