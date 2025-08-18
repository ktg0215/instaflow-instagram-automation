import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePosts, useScheduledPosts, useDraftPosts, usePublishedPosts } from '../hooks/usePosts';
import { Calendar, Clock, Edit, Trash2, Eye, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

const Schedule: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'draft' | 'published'>('all');
  
  // React Query hooks を使ってデータ取得
  const { posts: allPosts, isLoading: allLoading, deletePost, isDeleting } = usePosts();
  const { posts: scheduledPosts, isLoading: scheduledLoading } = useScheduledPosts();
  const { posts: draftPosts, isLoading: draftLoading } = useDraftPosts();
  const { posts: publishedPosts, isLoading: publishedLoading } = usePublishedPosts();

  // フィルターに応じて表示するデータを選択
  const getFilteredPosts = () => {
    switch (filter) {
      case 'scheduled':
        return scheduledPosts;
      case 'draft':
        return draftPosts;
      case 'published':
        return publishedPosts;
      case 'all':
      default:
        return allPosts;
    }
  };

  const getIsLoading = () => {
    switch (filter) {
      case 'scheduled':
        return scheduledLoading;
      case 'draft':
        return draftLoading;
      case 'published':
        return publishedLoading;
      case 'all':
      default:
        return allLoading;
    }
  };

  const filteredPosts = getFilteredPosts();
  const isLoading = getIsLoading();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-orange-100 text-orange-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('この投稿を削除してもよろしいですか？')) {
      deletePost(id);
    }
  };

  const handlePublishNow = (id: string) => {
    // Phase 7 で Instagram API と連携予定
    alert('今すぐ公開機能は Phase 7 で実装予定です');
  };

  // Loading状態は現在使用していません

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">投稿スケジュール</h2>
            <p className="text-gray-500 mt-1">予約投稿と公開済み投稿を管理</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white/80"
            >
              <option value="all">すべての投稿</option>
              <option value="scheduled">予約済み</option>
              <option value="draft">下書き</option>
              <option value="published">公開済み</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '総投稿数', value: allPosts.length, color: 'bg-blue-600' },
          { label: '予約済み', value: scheduledPosts.length, color: 'bg-cyan-600' },
          { label: '公開済み', value: publishedPosts.length, color: 'bg-blue-500' },
          { label: '下書き', value: draftPosts.length, color: 'bg-cyan-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Posts List */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200">
        <div className="p-6">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">投稿を読み込み中...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">選択したフィルターに該当する投稿が見つかりません</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors bg-white/60">
                  <div className="flex items-start space-x-4">
                    {/* Media Preview */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {post.image_url ? (
                        <img 
                          src={post.image_url} 
                          alt="Post preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Eye className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {post.caption || 'キャプションなし'}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                              {post.status === 'published' ? '公開済み' : 
                               post.status === 'scheduled' ? '予約済み' : 
                               post.status === 'draft' ? '下書き' : 
                               post.status === 'failed' ? '失敗' : post.status}
                            </span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {post.scheduled_at
                                ? `予約日時: ${format(new Date(post.scheduled_at), 'yyyy年MM月dd日 HH:mm')}`
                                : `作成日: ${format(new Date(post.created_at), 'yyyy年MM月dd日 HH:mm')}`
                              }
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {post.status === 'scheduled' && (
                            <button
                              onClick={() => handlePublishNow(post.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="今すぐ公開"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="投稿を編集"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={isDeleting}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="投稿を削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;