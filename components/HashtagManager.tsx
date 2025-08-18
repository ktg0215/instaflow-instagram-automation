import React, { useState } from 'react';
import { useHashtags, useHashtagSearch, usePopularHashtags } from '../hooks/useHashtags';
import { useToast } from '../context/ToastContext';
import { Hash, Plus, Edit2, Trash2, Search, Tag, TrendingUp, X, Check } from 'lucide-react';

interface HashtagManagerProps {
  onSelectHashtags?: (hashtags: string[]) => void;
  selectedHashtags?: string[];
  showSelection?: boolean;
}

const HashtagManager: React.FC<HashtagManagerProps> = ({
  onSelectHashtags,
  selectedHashtags = [],
  showSelection = false
}) => {
  const { showToast } = useToast();
  const {
    hashtags,
    categories,
    isLoading,
    createHashtag,
    updateHashtag,
    deleteHashtag,
    isCreating,
    isDeleting,
    createError,
    deleteError
  } = useHashtags();

  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    searchResults,
    isSearching,
    hasSearchCriteria
  } = useHashtagSearch();

  const { popularHashtags, isLoadingPopular } = usePopularHashtags(10);

  const [newHashtagName, setNewHashtagName] = useState('');
  const [newHashtagCategory, setNewHashtagCategory] = useState('');
  const [editingHashtag, setEditingHashtag] = useState<{
    id: string;
    name: string;
    category: string;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const displayHashtags = hasSearchCriteria ? searchResults : hashtags;

  const handleCreateHashtag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newHashtagName.trim()) {
      showToast({
        type: 'warning',
        title: '入力エラー',
        message: 'ハッシュタグ名を入力してください'
      });
      return;
    }

    try {
      createHashtag({
        name: newHashtagName.trim(),
        category: newHashtagCategory.trim() || undefined
      });
      
      setNewHashtagName('');
      setNewHashtagCategory('');
      setShowAddForm(false);
      
      showToast({
        type: 'success',
        title: '作成完了',
        message: 'ハッシュタグが作成されました'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: '作成失敗',
        message: error instanceof Error ? error.message : 'ハッシュタグの作成に失敗しました'
      });
    }
  };

  const handleUpdateHashtag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHashtag) return;

    try {
      updateHashtag({
        id: editingHashtag.id,
        data: {
          name: editingHashtag.name.trim(),
          category: editingHashtag.category.trim() || undefined
        }
      });
      
      setEditingHashtag(null);
      
      showToast({
        type: 'success',
        title: '更新完了',
        message: 'ハッシュタグが更新されました'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: '更新失敗',
        message: error instanceof Error ? error.message : 'ハッシュタグの更新に失敗しました'
      });
    }
  };

  const handleDeleteHashtag = async (id: string, name: string) => {
    if (!confirm(`「#${name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      deleteHashtag(id);
      
      showToast({
        type: 'success',
        title: '削除完了',
        message: 'ハッシュタグが削除されました'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: '削除失敗',
        message: error instanceof Error ? error.message : 'ハッシュタグの削除に失敗しました'
      });
    }
  };

  const handleSelectHashtag = (name: string) => {
    if (!showSelection || !onSelectHashtags) return;

    const isSelected = selectedHashtags.includes(name);
    if (isSelected) {
      onSelectHashtags(selectedHashtags.filter(tag => tag !== name));
    } else {
      onSelectHashtags([...selectedHashtags, name]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">ハッシュタグを読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Hash className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">ハッシュタグ管理</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>新規作成</span>
        </button>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="ハッシュタグを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((category: string) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasSearchCriteria && (
          <div className="mt-3 flex items-center text-sm text-gray-600">
            <span>検索結果: {searchResults.length}件</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="ml-3 text-blue-600 hover:text-blue-800"
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {/* 新規作成フォーム */}
      {showAddForm && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">新しいハッシュタグを作成</h3>
          <form onSubmit={handleCreateHashtag} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ハッシュタグ名 *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">#</span>
                  <input
                    type="text"
                    value={newHashtagName}
                    onChange={(e) => setNewHashtagName(e.target.value)}
                    placeholder="例: travel"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isCreating}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ
                </label>
                <input
                  type="text"
                  value={newHashtagCategory}
                  onChange={(e) => setNewHashtagCategory(e.target.value)}
                  placeholder="例: 旅行"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCreating}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewHashtagName('');
                  setNewHashtagCategory('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isCreating}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isCreating || !newHashtagName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 人気ハッシュタグ */}
      {!hasSearchCriteria && popularHashtags.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-medium text-purple-800">人気のハッシュタグ</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularHashtags.map((hashtag: any) => (
              <button
                key={hashtag.id}
                onClick={() => showSelection && handleSelectHashtag(hashtag.name)}
                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  showSelection
                    ? selectedHashtags.includes(hashtag.name)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-100'
                    : 'bg-white text-purple-700 border border-purple-300'
                }`}
              >
                <span>#{hashtag.name}</span>
                <span className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full">
                  {hashtag.usage_count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ハッシュタグ一覧 */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            ハッシュタグ一覧 ({displayHashtags.length})
          </h3>
        </div>
        
        {displayHashtags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>ハッシュタグが見つかりません</p>
            <p className="text-sm mt-1">新しいハッシュタグを作成してください</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayHashtags.map((hashtag: any) => (
              <div key={hashtag.id} className="p-4 hover:bg-gray-50 transition-colors">
                {editingHashtag?.id === hashtag.id ? (
                  // 編集フォーム
                  <form onSubmit={handleUpdateHashtag} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">#</span>
                          <input
                            type="text"
                            value={editingHashtag?.name || ''}
                            onChange={(e) => editingHashtag && setEditingHashtag({
                              ...editingHashtag,
                              name: e.target.value
                            })}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editingHashtag?.category || ''}
                          onChange={(e) => editingHashtag && setEditingHashtag({
                            ...editingHashtag,
                            category: e.target.value
                          })}
                          placeholder="カテゴリ"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingHashtag(null)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  // 表示モード
                  <div className="flex items-center justify-between">
                    <div 
                      className={`flex items-center space-x-3 flex-1 ${
                        showSelection ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => showSelection && handleSelectHashtag(hashtag.name)}
                    >
                      {showSelection && (
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedHashtags.includes(hashtag.name)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedHashtags.includes(hashtag.name) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">#{hashtag.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {hashtag.usage_count}回使用
                          </span>
                        </div>
                        {hashtag.category && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-500">{hashtag.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!showSelection && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingHashtag({
                            id: hashtag.id,
                            name: hashtag.name,
                            category: hashtag.category || ''
                          })}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteHashtag(hashtag.id, hashtag.name)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 選択されたハッシュタグの表示 */}
      {showSelection && selectedHashtags.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            選択中のハッシュタグ ({selectedHashtags.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedHashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleSelectHashtag(tag)}
                  className="hover:bg-blue-700 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagManager;