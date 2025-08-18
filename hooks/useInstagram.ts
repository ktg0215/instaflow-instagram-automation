import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InstagramService, InstagramMedia, InstagramProfile } from '../services/instagramService';

export const useInstagram = (userId: number | string | undefined) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  // Instagram接続状態を確認（モック実装で有効化）
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['instagram-profile', userId],
    queryFn: () => InstagramService.getUserProfile(),
    enabled: !!userId, // userIdがある場合のみ有効化
    retry: 1, // 1回までリトライ
    refetchOnMount: false, // マウント時のリフェッチを無効化
    refetchOnWindowFocus: false, // ウィンドウフォーカス時のリフェッチを無効化
    staleTime: 1000 * 60 * 5, // 5分間はキャッシュを使用
  });

  // プロフィール取得成功/失敗に応じて接続状態を更新
  useEffect(() => {
    if (profile) {
      setIsConnected(true);
    } else if (profileLoading === false && profileError) {
      setIsConnected(false);
    }
  }, [profile, profileLoading, profileError]);

  // ユーザーメディアを取得（モック実装で有効化）
  const { data: media = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['instagram-media', userId],
    queryFn: () => InstagramService.getUserMedia(25),
    enabled: !!userId && !!profile, // userIdとprofileがある場合のみ有効化
    retry: 1, // 1回までリトライ
    refetchOnMount: false, // マウント時のリフェッチを無効化
    refetchOnWindowFocus: false, // ウィンドウフォーカス時のリフェッチを無効化
    staleTime: 1000 * 60 * 5, // 5分間はキャッシュを使用
  });

  // 投稿作成ミューテーション（サーバーAPI経由）
  const createPostMutation = useMutation({
    mutationFn: async ({ imageUrl, caption }: { imageUrl: string; caption: string }) => {
      const res = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl: imageUrl, caption, mediaType: 'image' })
      })
      if (!res.ok) {
        let errorMessage = '画像投稿に失敗しました'
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage
        } catch {
          // HTML response or invalid JSON - use default message
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json()
      if (!data?.success) {
        throw new Error(data?.error || '画像投稿に失敗しました')
      }
      return data.instagramPostId as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-media', userId] });
    },
  });

  // 動画投稿作成ミューテーション（サーバーAPI経由）
  const createVideoPostMutation = useMutation({
    mutationFn: async ({ videoUrl, caption }: { videoUrl: string; caption: string }) => {
      const res = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl: videoUrl, caption, mediaType: 'video' })
      })
      if (!res.ok) {
        let errorMessage = '動画投稿に失敗しました'
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage
        } catch {
          // HTML response or invalid JSON - use default message
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json()
      if (!data?.success) {
        throw new Error(data?.error || '動画投稿に失敗しました')
      }
      return data.instagramPostId as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-media', userId] });
    },
  });

  // Instagram投稿を公開
  const publishToInstagram = async (postData: {
    mediaUrl: string;
    caption: string;
    mediaType: 'image' | 'video';
  }) => {
    try {
      let instagramPostId: string;

      if (postData.mediaType === 'video') {
        instagramPostId = await createVideoPostMutation.mutateAsync({
          videoUrl: postData.mediaUrl,
          caption: postData.caption
        });
      } else {
        instagramPostId = await createPostMutation.mutateAsync({
          imageUrl: postData.mediaUrl,
          caption: postData.caption
        });
      }

      return instagramPostId;
    } catch (error) {
      console.error('Instagram publish error:', error);
      throw error;
    }
  };

  // アクセストークンの有効性を確認
  const validateConnection = async () => {
    try {
      const isValid = await InstagramService.validateAccessToken();
      setIsConnected(isValid);
      return isValid;
    } catch (error) {
      setIsConnected(false);
      return false;
    }
  };

  // Instagram接続を保存（現在は未実装）
  const saveInstagramConnection = async (profile: InstagramProfile) => {
    if (!userId) return;
    console.log('Instagram connection save temporarily disabled');
  };

  // Instagram接続を解除
  const disconnectInstagram = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/instagram/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (!response.ok) {
        let errorMessage = '接続解除に失敗しました'
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage
        } catch {
          // HTML response or invalid JSON - use default message
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '接続解除に失敗しました');
      }
      
      return data;
    },
    onSuccess: () => {
      setIsConnected(false);
      queryClient.invalidateQueries({ queryKey: ['instagram-profile'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-media'] });
    }
  });

  // プロフィールが取得できたら接続情報を保存
  useEffect(() => {
    if (profile && userId) {
      saveInstagramConnection(profile);
    }
  }, [profile, userId]);

  return {
    profile,
    media,
    isConnected,
    isLoading: profileLoading || mediaLoading,
    publishToInstagram,
    validateConnection,
    disconnectInstagram: disconnectInstagram.mutate,
    isPublishing: createPostMutation.isPending || createVideoPostMutation.isPending,
    isDisconnecting: disconnectInstagram.isPending,
    publishError: createPostMutation.error || createVideoPostMutation.error,
    disconnectError: disconnectInstagram.error,
  };
};