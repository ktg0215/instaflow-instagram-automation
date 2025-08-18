import React, { useState } from 'react';
import { useInstagram } from '../hooks/useInstagram';
import { useAuth } from '../context/AuthContext';
import { InstagramService } from '../services/instagramService';
import { Instagram, CheckCircle, AlertCircle, RefreshCw, ExternalLink, Settings, Info } from 'lucide-react';

const InstagramConnection: React.FC = () => {
  const { user } = useAuth();
  const { 
    profile, 
    media, 
    isConnected, 
    isLoading, 
    validateConnection 
  } = useInstagram(user?.id ? String(user.id) : undefined);
  
  const [isValidating, setIsValidating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim()) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // 環境変数を更新（実際の実装では、これはサーバーサイドで行う必要があります）
      // ここでは一時的にlocalStorageに保存
      localStorage.setItem('INSTAGRAM_ACCESS_TOKEN', accessToken);
      
      // 接続テストを実行
      const result = await InstagramService.testConnection();
      
      if (result.instagramConnected) {
        setSaveMessage('Instagram連携が正常に保存されました！ページを再読み込みしてください。');
        // 実際の実装では、ここでページをリロードするか、状態を更新
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSaveMessage(`接続に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Save connection error:', error);
      setSaveMessage('保存中にエラーが発生しました。トークンを確認してください。');
    } finally {
      setIsSaving(false);
    }
  };
  const handleValidateConnection = async () => {
    setIsValidating(true);
    try {
      await validateConnection();
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestConnection = async () => {
    setIsValidating(true);
    try {
      const result = await InstagramService.testConnection();
      setTestResult(result);
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-300 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Instagram接続を確認中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-300">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Instagram className="w-8 h-8 text-pink-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Instagram連携</h3>
              <p className="text-sm text-gray-500">アカウントの接続状態と最近の投稿</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">接続済み</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">未接続</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {isConnected && profile ? (
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">@{profile.username}</h4>
                  <p className="text-sm text-gray-600">
                    {profile.account_type} アカウント • {profile.media_count} 投稿
                  </p>
                  {profile.followers_count && (
                    <p className="text-sm text-gray-600">
                      フォロワー: {profile.followers_count.toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleValidateConnection}
                  disabled={isValidating}
                  className="flex items-center space-x-1 px-3 py-1 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
                  <span className="text-sm">更新</span>
                </button>
              </div>
            </div>

            {/* Recent Media */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">最近の投稿</h4>
              {media.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {media.slice(0, 6).map((item) => (
                    <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 group relative">
                      {item.media_type === 'VIDEO' ? (
                        <video 
                          src={item.media_url} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          muted
                        />
                      ) : (
                        <img 
                          src={item.media_url} 
                          alt="Instagram post"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <a
                          href={item.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-6 h-6 text-white" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Instagram className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>投稿がありません</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <p className="text-2xl font-bold text-blue-600">{profile.media_count || media.length}</p>
                <p className="text-sm text-blue-800">取得済み投稿</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <p className="text-2xl font-bold text-green-600">
                  {media.reduce((sum, item) => sum + (item.like_count || 0), 0)}
                </p>
                <p className="text-sm text-green-800">総いいね数</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Instagram className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Instagram未接続</h4>
            <p className="text-gray-600 mb-6">
              Instagramアカウントを接続してください
            </p>

            {/* Instagram Connection Form */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h5 className="font-semibold text-gray-900 mb-4">Instagram連携設定</h5>
              <form onSubmit={handleSaveConnection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Page Access Token
                  </label>
                  <textarea
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAARv67YfWyUBP..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Facebook Developer Consoleから取得した長期アクセストークン
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Username（オプション）
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_instagram_username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Instagramのユーザー名（@なし）- 自動取得されるため入力不要
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!accessToken.trim() || isSaving}
                    className="w-full px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        保存中...
                      </div>
                    ) : (
                      'Instagram連携を保存'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Facebook Page Access Token取得手順:</p>
                  <ol className="list-decimal list-inside space-y-1 mb-3">
                    <li><a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Facebook Developer Console</a>でアプリを作成</li>
                    <li>Instagram Graph APIを製品に追加</li>
                    <li>Instagramアカウントをビジネスアカウントに変更</li>
                    <li>FacebookページとInstagramアカウントを連携</li>
                    <li><a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Graph API Explorer</a>で長期アクセストークンを取得</li>
                  </ol>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                    <p className="font-medium text-yellow-800">⚠️ 重要な更新 (2025年1月27日まで)</p>
                    <p className="text-yellow-700 text-xs mt-1">
                      新しい権限スコープに移行してください：
                    </p>
                    <ul className="text-xs text-yellow-700 mt-1 ml-4">
                      <li>• instagram_business_basic</li>
                      <li>• instagram_business_content_publish</li>
                      <li>• instagram_business_manage_comments</li>
                    </ul>
                  </div>
                  <p className="text-xs text-blue-600">
                    従来の権限: pages_show_list, pages_read_engagement, instagram_basic, instagram_content_publish
                  </p>
                </div>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`border rounded-lg p-4 mb-4 text-left ${
                testResult.instagramConnected 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-sm">
                  <p className="font-medium mb-2">接続テスト結果:</p>
                  <ul className="space-y-1">
                    <li>トークン有効: {testResult.tokenValid ? '✅' : '❌'}</li>
                    <li>Facebookページ数: {testResult.pagesFound}</li>
                    <li>Instagram接続: {testResult.instagramConnected ? '✅' : '❌'}</li>
                    {testResult.profile && (
                      <li>アカウント: @{testResult.profile.username}</li>
                    )}
                    {testResult.tokenInfo && (
                      <li className="text-xs text-gray-600">
                        ユーザーID: {testResult.tokenInfo.id} ({testResult.tokenInfo.name})
                      </li>
                    )}
                    {testResult.error && (
                      <li className="text-red-600">エラー: {testResult.error}</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Migration Guide */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 text-left">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-2">📅 2025年1月27日までの移行ガイド:</p>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center">
                      <span className="inline-block w-6 h-6 bg-orange-200 text-orange-800 rounded-full text-xs text-center leading-6 mr-2">1</span>
                      <span className="text-xs">Facebook Developer Consoleで新しい権限スコープを追加</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-6 h-6 bg-orange-200 text-orange-800 rounded-full text-xs text-center leading-6 mr-2">2</span>
                      <span className="text-xs">App Reviewプロセスで新スコープの承認を取得</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-6 h-6 bg-orange-200 text-orange-800 rounded-full text-xs text-center leading-6 mr-2">3</span>
                      <span className="text-xs">新しいスコープで長期アクセストークンを再取得</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-6 h-6 bg-orange-200 text-orange-800 rounded-full text-xs text-center leading-6 mr-2">4</span>
                      <span className="text-xs">システム内のトークンを更新</span>
                    </div>
                  </div>
                  <p className="text-xs text-orange-700">
                    詳細: <a href="https://developers.facebook.com/docs/instagram-platform" target="_blank" rel="noopener noreferrer" className="underline">Instagram Platform Documentation</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleTestConnection}
                disabled={isValidating}
                className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 font-medium"
              >
                {isValidating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    接続テスト中...
                  </div>
                ) : (
                  '接続をテスト'
                )}
              </button>
              
              <button
                onClick={async () => {
                  const token = localStorage.getItem('INSTAGRAM_ACCESS_TOKEN') || '';
                  
                  if (!token) {
                    alert('アクセストークンが設定されていません。上記フォームでトークンを入力してください。');
                    return;
                  }
                  
                  try {
                    // Test basic token validation
                    const response = await fetch(`https://graph.facebook.com/v23.0/me?access_token=${token}`);
                    const data = await response.json();
                    
                    if (data.error) {
                      console.error('Token error:', data.error);
                      alert(`トークンエラー: ${data.error.message || JSON.stringify(data.error)}`);
                      return;
                    }
                    
                    // Test pages endpoint
                    const pagesResponse = await fetch(`https://graph.facebook.com/v23.0/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`);
                    const pagesData = await pagesResponse.json();
                    
                    if (pagesData.error) {
                      console.error('Pages error:', pagesData.error);
                      alert(`ページ取得エラー: ${pagesData.error.message || JSON.stringify(pagesData.error)}`);
                      return;
                    }
                    
                    alert('デバッグ情報をコンソールに出力しました。F12を開いてConsoleタブを確認してください。');
                  } catch (error) {
                    console.error('Debug test error:', error);
                    alert(`デバッグテストエラー: ${error}`);
                  }
                }}
                className="w-full px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all"
              >
                🔍 詳細デバッグテスト
              </button>
            </div>

            {/* Debug Section */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center">
                <Settings className="w-4 h-4 mr-1" />
                デバッグ情報を表示
              </summary>
              <div className="mt-3 bg-gray-100 rounded-lg p-4 text-left">
                <pre className="text-xs text-gray-700 overflow-auto">
                  {JSON.stringify({
                    hasToken: !!(localStorage.getItem('INSTAGRAM_ACCESS_TOKEN')),
                    tokenLength: localStorage.getItem('INSTAGRAM_ACCESS_TOKEN')?.length || 0,
                    tokenPrefix: localStorage.getItem('INSTAGRAM_ACCESS_TOKEN')?.substring(0, 20) + '...',
                    testResult,
                    apiVersion: 'v23.0',
                    baseUrl: 'https://graph.facebook.com/v23.0'
                  }, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramConnection;