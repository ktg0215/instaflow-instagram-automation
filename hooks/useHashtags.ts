import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Hashtag } from '../services/hashtagService';

export interface HashtagCreateData {
  name: string;
  category?: string;
}

export interface HashtagUpdateData {
  name?: string;
  category?: string;
}

export const useHashtags = () => {
  const queryClient = useQueryClient();

  // 全ハッシュタグ取得
  const {
    data: hashtags = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['hashtags'],
    queryFn: async () => {
      const response = await fetch('/api/hashtags');
      if (!response.ok) {
        throw new Error('ハッシュタグの取得に失敗しました');
      }
      const data = await response.json();
      return data.success ? data.data : [];
    }
  });

  // カテゴリ一覧取得
  const {
    data: categories = [],
    isLoading: categoriesLoading
  } = useQuery({
    queryKey: ['hashtag-categories'],
    queryFn: async () => {
      const response = await fetch('/api/hashtags/categories');
      if (!response.ok) {
        throw new Error('カテゴリの取得に失敗しました');
      }
      const data = await response.json();
      return data.success ? data.data : [];
    }
  });

  // ハッシュタグ作成
  const createHashtagMutation = useMutation({
    mutationFn: async (hashtagData: HashtagCreateData) => {
      const response = await fetch('/api/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hashtagData)
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'ハッシュタグの作成に失敗しました');
      }
      
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-categories'] });
    }
  });

  // ハッシュタグ更新
  const updateHashtagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: HashtagUpdateData }) => {
      const response = await fetch(`/api/hashtags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ハッシュタグの更新に失敗しました');
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-categories'] });
    }
  });

  // ハッシュタグ削除
  const deleteHashtagMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/hashtags/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'ハッシュタグの削除に失敗しました');
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-categories'] });
    }
  });

  return {
    // データ
    hashtags,
    categories,
    isLoading,
    categoriesLoading,
    error,

    // 操作
    createHashtag: createHashtagMutation.mutate,
    updateHashtag: updateHashtagMutation.mutate,
    deleteHashtag: deleteHashtagMutation.mutate,
    refetch,

    // 状態
    isCreating: createHashtagMutation.isPending,
    isUpdating: updateHashtagMutation.isPending,
    isDeleting: deleteHashtagMutation.isPending,
    createError: createHashtagMutation.error,
    updateError: updateHashtagMutation.error,
    deleteError: deleteHashtagMutation.error
  };
};

// 検索・フィルタ用フック
export const useHashtagSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const {
    data: searchResults = [],
    isLoading: isSearching
  } = useQuery({
    queryKey: ['hashtags-search', searchQuery, selectedCategory],
    queryFn: async () => {
      if (!searchQuery && !selectedCategory) return [];

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/hashtags?${params.toString()}`);
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }
      
      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!(searchQuery || selectedCategory)
  });

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    searchResults,
    isSearching,
    hasSearchCriteria: !!(searchQuery || selectedCategory)
  };
};

// 人気ハッシュタグ用フック
export const usePopularHashtags = (limit: number = 20) => {
  const {
    data: popularHashtags = [],
    isLoading: isLoadingPopular
  } = useQuery({
    queryKey: ['hashtags-popular', limit],
    queryFn: async () => {
      const response = await fetch(`/api/hashtags?popular=${limit}`);
      if (!response.ok) {
        throw new Error('人気ハッシュタグの取得に失敗しました');
      }
      
      const data = await response.json();
      return data.success ? data.data : [];
    }
  });

  return {
    popularHashtags,
    isLoadingPopular
  };
};