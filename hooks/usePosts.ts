import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import type { Post, PostInsert, PostUpdate } from '@/services/postService';

// APIクライアント関数
const postsAPI = {
  async getUserPosts(token: string, status?: string): Promise<Post[]> {
    const url = status ? `/api/posts?status=${status}` : '/api/posts';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch posts'
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage
      } catch {
        // HTML response or invalid JSON - use default message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.posts;
  },

  async createPost(token: string, postData: Omit<PostInsert, 'user_id'>): Promise<Post> {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create post'
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage
      } catch {
        // HTML response or invalid JSON - use default message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.post;
  },

  async updatePost(token: string, id: string, updates: PostUpdate): Promise<Post> {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update post'
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage
      } catch {
        // HTML response or invalid JSON - use default message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.post;
  },

  async deletePost(token: string, id: string): Promise<void> {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete post'
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage
      } catch {
        // HTML response or invalid JSON - use default message
      }
      throw new Error(errorMessage);
    }
  },

  async getPostById(token: string, id: string): Promise<Post> {
    const response = await fetch(`/api/posts/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch post'
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage
      } catch {
        // HTML response or invalid JSON - use default message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.post;
  },
};

// Hooks
export const usePosts = (status?: string) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: posts = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['posts', status],
    queryFn: () => token ? postsAPI.getUserPosts(token, status) : Promise.resolve([]),
    enabled: !!token,
    refetchInterval: 30000, // 30秒ごとに更新
  });

  const createPostMutation = useMutation({
    mutationFn: (postData: Omit<PostInsert, 'user_id'>) => {
      if (!token) throw new Error('認証が必要です');
      return postsAPI.createPost(token, postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PostUpdate }) => {
      if (!token) throw new Error('認証が必要です');
      return postsAPI.updatePost(token, id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('認証が必要です');
      return postsAPI.deletePost(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    posts,
    isLoading,
    error,
    createPost: createPostMutation.mutate,
    updatePost: updatePostMutation.mutate,
    deletePost: deletePostMutation.mutate,
    isCreating: createPostMutation.isPending,
    isUpdating: updatePostMutation.isPending,
    isDeleting: deletePostMutation.isPending,
    createError: createPostMutation.error,
    updateError: updatePostMutation.error,
    deleteError: deletePostMutation.error,
  };
};

export const usePost = (id: string) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['post', id],
    queryFn: () => {
      if (!token) throw new Error('認証が必要です');
      return postsAPI.getPostById(token, id);
    },
    enabled: !!token && !!id,
  });
};

export const useScheduledPosts = () => {
  return usePosts('scheduled');
};

export const useDraftPosts = () => {
  return usePosts('draft');
};

export const usePublishedPosts = () => {
  return usePosts('published');
};