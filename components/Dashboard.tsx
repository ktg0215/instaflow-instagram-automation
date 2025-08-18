"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
import { TrendingUp, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import InstagramConnection from './InstagramConnection';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PostAnalytics {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  draftPosts: number;
}

const Dashboard: React.FC = () => {
  // useAppは現在使用していません
  const { user } = useAuth();
  const { 
    isConnected: instagramConnected, 
    profile: instagramProfile, 
    media: instagramMedia,
    isLoading: instagramLoading 
  } = useInstagram(user?.id ? String(user.id) : undefined);
  const [analytics, setAnalytics] = React.useState<PostAnalytics | null>(null);
  const router = useRouter();

  // ダミーの投稿データ
  const fixedNow = new Date('2025-01-01T00:00:00Z'); // SSR/CSR差異を避けるため固定
  const posts = [
    {
      id: '1',
      title: '朝のコーヒータイム',
      content: '今日も素晴らしい一日の始まりです ☕️',
      status: 'published',
      scheduled_time: null,
      media_url: null,
      created_at: new Date(fixedNow.getTime() - 3600000).toISOString()
    },
    {
      id: '2',
      title: '新商品の紹介',
      content: '当店の新商品をご紹介します！',
      status: 'scheduled',
      scheduled_time: new Date(fixedNow.getTime() + 7200000).toISOString(),
      media_url: null,
      created_at: new Date(fixedNow.getTime() - 1800000).toISOString()
    },
    {
      id: '3',
      title: '週末のイベント告知',
      content: '週末のスペシャルイベントにぜひお越しください 🎉',
      status: 'draft',
      scheduled_time: null,
      media_url: null,
      created_at: new Date(fixedNow.getTime() - 900000).toISOString()
    },
    {
      id: '4',
      title: 'お客様の声',
      content: 'いつもありがとうございます！',
      status: 'published',
      scheduled_time: null,
      media_url: null,
      created_at: new Date(fixedNow.getTime() - 5400000).toISOString()
    },
    {
      id: '5',
      title: '季節の挨拶',
      content: '暖かい春の日をお楽しみください 🌸',
      status: 'published',
      scheduled_time: null,
      media_url: null,
      created_at: new Date(fixedNow.getTime() - 10800000).toISOString()
    }
  ];

  React.useEffect(() => {
    // APIが利用可能でない場合のダミーデータ
    setAnalytics({
      totalPosts: 24,
      scheduledPosts: 8,
      publishedPosts: 16,
      draftPosts: 5
    });
  }, [user?.id]);

  const stats = [
    {
      title: '総投稿数',
      value: analytics?.totalPosts || 0,
      icon: TrendingUp,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      title: '予約済み',
      value: analytics?.scheduledPosts || 0,
      icon: Clock,
      color: 'from-cyan-600 to-blue-600',
    },
    {
      title: '公開済み',
      value: analytics?.publishedPosts || 0,
      icon: CheckCircle,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: '下書き',
      value: analytics?.draftPosts || 0,
      icon: AlertCircle,
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  // Loading状態は現在使用していません

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">おかえりなさい！</h2>
        <p className="text-blue-100 mb-4 text-sm sm:text-base">
          素晴らしいコンテンツを作成する準備はできていますか？AIを活用した投稿でInstagramの存在感を高めましょう。
        </p>
        <button 
          onClick={() => router.push('/create')}
          className="bg-white text-blue-700 px-4 py-2 sm:px-6 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-lg text-sm sm:text-base"
        >
          新しい投稿を作成
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Posts */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-300">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">最近の投稿</h3>
            <button 
              onClick={() => router.push('/schedule')}
              className="text-blue-700 hover:text-blue-800 font-medium text-sm sm:text-base"
            >
              すべて表示
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {post.media_url && (
                    <img 
                      src={post.media_url} 
                      alt="Post preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {post.content}
                  </p>
                  <p className="text-xs text-gray-500">
                      {post.scheduled_time 
                        ? `予約日時: ${format(new Date(post.scheduled_time), 'yyyy年MM月dd日 HH:mm', { locale: ja })}`
                        : `作成日: ${format(new Date(post.created_at), 'yyyy年MM月dd日', { locale: ja })}`
                      }
                  </p>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    post.status === 'published' 
                      ? 'bg-green-100 text-green-800'
                      : post.status === 'scheduled'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {post.status === 'published' ? '公開済み' : 
                     post.status === 'scheduled' ? '予約済み' : 
                     post.status === 'draft' ? '下書き' : post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

        {/* Right Panel - Role-based content */}
        <div className="lg:col-span-1">
          {user?.role === 'admin' ? (
            // 管理者の場合: Instagram連携を表示
            <InstagramConnection />
          ) : (
            // 一般ユーザーの場合: アカウント情報を表示
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-300">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  アカウント情報
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-gray-900">{user?.name || 'ユーザー'}</h4>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {user?.role === 'admin' ? '管理者' : '一般ユーザー'}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">登録日: {user?.created_at ? format(new Date(user.created_at), 'yyyy年MM月dd日') : '-'}</p>
                    <p>ステータス: <span className="text-green-600 font-medium">アクティブ</span></p>
                  </div>
                </div>
                {instagramLoading && (
                  <div className="border-t pt-4">
                    <div className="flex items-center text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Instagram接続状態を確認中...
                    </div>
                  </div>
                )}
                {!instagramLoading && instagramConnected && instagramProfile && (
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Instagram連携済み
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-900">@{instagramProfile.username}</p>
                            <p className="text-xs text-green-700">
                              {instagramProfile.account_type} • {instagramProfile.media_count || 0} 投稿
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-600">取得済み</p>
                            <p className="text-sm font-bold text-green-800">{instagramMedia?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!instagramLoading && instagramConnected && !instagramProfile && (
                  <div className="border-t pt-4">
                    <div className="flex items-center text-sm text-yellow-600">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Instagram連携中（プロフィール取得中）
                    </div>
                  </div>
                )}
                {!instagramLoading && !instagramConnected && (
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Instagram未接続
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-red-700 mb-2">
                          Instagramアカウントを接続して投稿を自動化しましょう
                        </p>
                        <button 
                          onClick={() => router.push('/settings')}
                          className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-2 px-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-colors text-sm font-medium"
                        >
                          Instagram連携を設定
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;