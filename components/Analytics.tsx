import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
// Removed direct PostService import to prevent server-side database access from client
import { TrendingUp, Eye, Heart, MessageCircle, Share, Users, Calendar } from 'lucide-react';

interface AnalyticsData {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  totalEngagement: number;
  averageReach: number;
  engagementRate: number;
  topPerformingPosts: Array<{
    id: string;
    content: string;
    engagement: number;
    reach: number;
  }>;
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { media, profile, isConnected } = useInstagram(user?.id ? String(user.id) : undefined);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [user?.id, timeRange]);

  const loadAnalytics = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch analytics data from dedicated analytics API
      const response = await fetch('/api/analytics', {
        method: 'GET',
        credentials: 'include', // Include cookies for NextAuth session
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics({
          totalPosts: data.totalPosts || 0,
          publishedPosts: data.publishedPosts || 0,
          scheduledPosts: data.scheduledPosts || 0,
          draftPosts: data.draftPosts || 0,
          totalEngagement: data.totalEngagement || 0,
          averageReach: data.averageReach || 0,
          engagementRate: parseFloat(data.engagementRate) || 0,
          topPerformingPosts: data.topPerformingPosts || []
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch analytics:', errorData);
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Analytics load error:', error);
      // Set default analytics data on error
      setAnalytics({
        totalPosts: 0,
        publishedPosts: 0,
        scheduledPosts: 0,
        draftPosts: 0,
        totalEngagement: 0,
        averageReach: 0,
        engagementRate: 0,
        topPerformingPosts: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Instagram メディアから実際の統計を計算
  const calculateInstagramStats = () => {
    if (!media || media.length === 0) {
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        engagementRate: 0,
        totalReach: 0
      };
    }

    const totalLikes = media.reduce((sum, item) => sum + (item.like_count || 0), 0);
    const totalComments = media.reduce((sum, item) => sum + (item.comments_count || 0), 0);
    const totalViews = media.length * 100; // 推定値（実際のビュー数はInsights APIが必要）
    const totalReach = Math.floor(totalViews * 0.8); // 推定リーチ
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalReach,
      engagementRate: Math.round(engagementRate * 100) / 100
    };
  };

  const instagramStats = calculateInstagramStats();

  const metrics = [
    { 
      label: '総投稿数', 
      value: analytics?.totalPosts || 0, 
      change: '+0%', 
      icon: Eye, 
      color: 'text-blue-600' 
    },
    { 
      label: 'いいね数', 
      value: instagramStats.totalLikes.toLocaleString(), 
      change: '+0%', 
      icon: Heart, 
      color: 'text-red-600' 
    },
    { 
      label: 'コメント数', 
      value: instagramStats.totalComments.toLocaleString(), 
      change: '+0%', 
      icon: MessageCircle, 
      color: 'text-green-600' 
    },
    { 
      label: 'エンゲージメント率', 
      value: `${instagramStats.engagementRate}%`, 
      change: '+0%', 
      icon: TrendingUp, 
      color: 'text-purple-600' 
    },
    { 
      label: 'フォロワー数', 
      value: profile?.followers_count?.toLocaleString() || '0', 
      change: '+0%', 
      icon: Users, 
      color: 'text-orange-600' 
    },
    { 
      label: '推定リーチ', 
      value: instagramStats.totalReach.toLocaleString(), 
      change: '+0%', 
      icon: Share, 
      color: 'text-indigo-600' 
    },
  ];

  // 最近の投稿データ（実際のInstagramメディアから）
  const recentPosts = media.slice(0, 10).map((item, index) => ({
    id: item.id,
    caption: item.caption?.substring(0, 50) + '...' || '投稿 ' + (index + 1),
    views: '推定値',
    likes: (item.like_count || 0).toLocaleString(),
    comments: (item.comments_count || 0).toLocaleString(),
    engagement: item.like_count && item.comments_count 
      ? `${(((item.like_count + item.comments_count) / 100) * 100).toFixed(1)}%`
      : '0%',
    date: new Date(item.timestamp).toLocaleDateString('ja-JP')
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">分析データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-blue-200">
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instagram未接続</h3>
            <p className="text-gray-600 mb-4">
              分析データを表示するには、まずInstagramアカウントを接続してください。
            </p>
            <p className="text-sm text-blue-600 mb-4">
              Phase 5: モック実装では仮想データで動作確認が可能です
            </p>
            <button 
              onClick={() => {
                window.location.href = '/settings';
              }}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              設定画面で接続
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">分析ダッシュボード</h2>
            <p className="text-gray-500 mt-1">
              {isConnected ? `@${profile?.username} のパフォーマンス` : 'Instagramのパフォーマンスを追跡'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">過去7日間</option>
              <option value="30">過去30日間</option>
              <option value="90">過去90日間</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{metric.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 ${metric.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Performance Chart */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">投稿パフォーマンス</h3>
          {media.length > 0 ? (
            <div className="h-64 flex items-end justify-between space-x-2">
              {media.slice(0, 14).map((item, index) => {
                const height = Math.max(20, Math.min(100, ((item.like_count || 0) / Math.max(...media.map(m => m.like_count || 0))) * 100));
                return (
                  <div 
                    key={item.id} 
                    className="bg-gradient-to-t from-blue-600 to-cyan-600 rounded-t-md flex-1 min-w-[8px]"
                    style={{ height: `${height}%` }}
                    title={`${item.like_count || 0} いいね`}
                  ></div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>投稿データがありません</p>
              </div>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>最新</span>
            <span>過去</span>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">アカウント概要</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">アカウントタイプ</span>
              <span className="font-medium">{profile?.account_type || '未接続'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">総投稿数</span>
              <span className="font-medium">{profile?.media_count || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">取得済み投稿</span>
              <span className="font-medium">{media.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">平均いいね数</span>
              <span className="font-medium">
                {media.length > 0 
                  ? Math.round(instagramStats.totalLikes / media.length)
                  : 0
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">平均コメント数</span>
              <span className="font-medium">
                {media.length > 0 
                  ? Math.round(instagramStats.totalComments / media.length)
                  : 0
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts Performance */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">最近の投稿のパフォーマンス</h3>
        </div>
        <div className="overflow-x-auto">
          {recentPosts.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    投稿
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    投稿日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    いいね数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    コメント数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    推定エンゲージメント
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {post.caption}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {post.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {post.likes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {post.comments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {post.engagement}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>投稿データがありません</p>
              <p className="text-sm mt-1">Instagramに投稿を作成すると、ここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;