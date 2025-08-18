import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
import { Instagram, ExternalLink, CheckCircle, AlertCircle, Users } from 'lucide-react';

interface InstagramAccount {
  id: number;
  username: string;
  account_type: string;
  media_count: number;
  followers_count: number;
  connected_at: string;
}

const UserInstagramConnect: React.FC = () => {
  const { user, token } = useAuth();
  const { 
    profile, 
    isConnected, 
    isLoading, 
    disconnectInstagram, 
    isDisconnecting, 
    disconnectError 
  } = useInstagram(user?.id ? String(user.id) : undefined);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [status, setStatus] = useState<{
    tokenConfigured: boolean
    tokenValid: boolean
    remainingDays: number | null
    instagramConnected: boolean
  } | null>(null)

  useEffect(() => {
    // サーバーAPIからトークン状態を取得（モック）
    (async () => {
      try {
        const res = await fetch('/api/instagram/status')
        if (res.ok) {
          const data = await res.json()
          setStatus({
            tokenConfigured: !!data.tokenConfigured,
            tokenValid: !!data.tokenValid,
            remainingDays: data.remainingDays ?? null,
            instagramConnected: !!data.instagramConnected,
          })
        }
      } catch (_) {
        // Phase 5: モック状態を設定
        setStatus({
          tokenConfigured: true,
          tokenValid: true,
          remainingDays: 45,
          instagramConnected: isConnected,
        })
      }
    })()
  }, [isConnected]);

  const handleInstagramConnect = () => {
    // Phase 5: モック実装 - 実際の接続をシミュレート
    setConnecting(true);
    
    // モック接続プロセス
    setTimeout(() => {
      setConnecting(false);
      setMessage({ 
        type: 'success', 
        text: '仮想Instagramアカウントに接続されました（Phase 5 モック実装）' 
      });
      setTimeout(() => setMessage(null), 5000);
    }, 2000);
  };

  const handleDisconnect = async () => {
    if (!confirm('Instagramアカウントの接続を解除しますか？')) return;

    try {
      disconnectInstagram();
      setMessage({ type: 'success', text: 'Instagramアカウントの接続を解除しました' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'アカウントの接続解除に失敗しました' });
    }
  };

  // disconnectErrorを監視してエラーメッセージを表示
  useEffect(() => {
    if (disconnectError) {
      setMessage({ 
        type: 'error', 
        text: disconnectError instanceof Error ? disconnectError.message : 'アカウントの接続解除に失敗しました' 
      });
    }
  }, [disconnectError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        <span className="ml-2 text-gray-600">アカウント情報を読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <Instagram className="w-8 h-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Instagram アカウント</h2>
            <p className="text-pink-100 mt-1">Instagramアカウントを接続して投稿を管理</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Account Status */}
      {isConnected && profile ? (
        /* Connected Account */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {profile.profile_picture_url ? (
                    <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    @{profile.username}
                    <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">{profile.account_type.toLowerCase()} アカウント</p>
                  {profile.name && (
                    <p className="text-sm text-gray-500">{profile.name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
              >
                {isDisconnecting ? '解除中...' : '接続解除'}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{profile.media_count}</div>
                <div className="text-sm text-gray-600">投稿数</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{profile.followers_count || 0}</div>
                <div className="text-sm text-gray-600">フォロワー</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Not Connected */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 text-center">
            <Instagram className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instagramアカウントが接続されていません</h3>
            <p className="text-gray-600 mb-6">
              Instagramアカウントを接続して、投稿の作成・管理・分析を行うことができます。
            </p>

            {/* Token status */}
            {status && (
              <div className={`mb-4 inline-flex items-center text-sm px-3 py-1 rounded-full ${
                status.tokenValid
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : status.tokenConfigured
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {status.tokenValid
                  ? `トークン有効${
                      typeof status.remainingDays === 'number' ? `（残り約${status.remainingDays}日）` : ''
                    }`
                  : status.tokenConfigured
                  ? 'トークン設定済み（無効または期限切れの可能性）'
                  : 'トークン未設定'}
              </div>
            )}
            
            <button
              onClick={handleInstagramConnect}
              disabled={connecting}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Instagram className="w-5 h-5 mr-2" />
              {connecting ? '接続中...' : 'Instagramに接続'}
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          接続後の機能
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-purple-600" />
            <span>投稿の作成・編集・削除</span>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-purple-600" />
            <span>投稿のスケジュール管理</span>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-purple-600" />
            <span>パフォーマンス分析</span>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-purple-600" />
            <span>AIによるコンテンツ生成</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInstagramConnect;