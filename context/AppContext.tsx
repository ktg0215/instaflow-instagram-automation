'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePosts } from '../hooks/usePosts';
// PostService内の型定義を使用
interface Post {
  id: string;
  user_id: string;
  instagram_account_id?: string | null;
  caption: string;
  image_url?: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string | null;
  published_at?: string | null;
  instagram_post_id?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

interface PostInsert {
  caption: string;
  image_url?: string | null;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string | null;
}

interface PostUpdate {
  caption?: string;
  image_url?: string | null;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string | null;
}

interface AppContextType {
  posts: Post[];
  currentView: string;
  setCurrentView: (view: string) => void;
  addPost: (post: Omit<PostInsert, 'user_id'>) => void;
  updatePost: (id: string, updates: PostUpdate) => void;
  deletePost: (id: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { 
    posts, 
    isLoading, 
    createPost, 
    updatePost: updatePostMutation, 
    deletePost: deletePostMutation 
  } = usePosts(user?.id ? String(user.id) : undefined);

  const [currentView, setCurrentView] = useState('dashboard');

  const addPost = (postData: Omit<PostInsert, 'user_id'>) => {
    if (!user) return;
    
    // Transform local PostInsert to service PostInsert format
    const servicePostData = {
      caption: postData.caption,
      image_url: postData.image_url,
      status: postData.status as 'draft' | 'scheduled' | 'published',
      scheduled_at: postData.scheduled_at,
    };
    
    createPost(servicePostData);
  };

  const updatePost = (id: string, updates: PostUpdate) => {
    // Transform local PostUpdate to service PostUpdate format
    const serviceUpdates = {
      caption: updates.caption,
      image_url: updates.image_url,
      status: updates.status,
      scheduled_at: updates.scheduled_at,
    };
    
    updatePostMutation({ id, updates: serviceUpdates });
  };

  const deletePost = (id: string) => {
    deletePostMutation(id);
  };

  return (
    <AppContext.Provider value={{
      posts,
      currentView,
      setCurrentView,
      addPost,
      updatePost,
      deletePost,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};