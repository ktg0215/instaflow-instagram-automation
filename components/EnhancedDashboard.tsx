'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
import { useIntegratedApi } from '../hooks/useIntegratedApi';
import { useProgressiveEnhancement, AdaptiveAnimation } from './ProgressiveEnhancement';
import RealTimeIntegration from './RealTimeIntegration';
import EnhancedErrorBoundary from './ErrorBoundary';
import { 
  TrendingUp, Clock, CheckCircle, AlertCircle, User, Plus,
  Calendar as CalendarIcon, BarChart3, Activity, Target,
  ChevronLeft, ChevronRight, Eye, Heart, MessageCircle,
  Share, Users, Zap, Settings
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PostAnalytics {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  draftPosts: number;
}

interface EngagementData {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  status: 'published' | 'scheduled' | 'draft';
  scheduled_time: string | null;
  media_url: string | null;
  created_at: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    isConnected: instagramConnected, 
    profile: instagramProfile, 
    media: instagramMedia,
    isLoading: instagramLoading 
  } = useInstagram(user?.id ? String(user.id) : undefined);
  
  const router = useRouter();
  const { useDashboardData, useOptimisticPosts, performanceMetrics } = useIntegratedApi();
  const { preferences, features, capabilities } = useProgressiveEnhancement();
  
  // Use integrated dashboard data with real-time updates
  const { 
    dashboard, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard,
    optimization: dashboardOptimization,
    isRealTime 
  } = useDashboardData();

  // Use optimistic posts
  const {
    posts,
    isLoading: postsLoading,
    hasOptimisticUpdates
  } = useOptimisticPosts({
    fields: ['id', 'caption', 'status', 'created_at', 'scheduled_at', 'engagement'],
    include: ['analytics'],
    compress: true,
    optimistic: preferences.optimisticUI
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'overview' | 'calendar' | 'analytics'>('overview');
  const [animateCards, setAnimateCards] = useState(false);

  // Sample data - replace with real API calls
  const engagementData: EngagementData[] = [
    { date: '01/01', likes: 120, comments: 15, shares: 8, impressions: 1200 },
    { date: '01/02', likes: 145, comments: 22, shares: 12, impressions: 1580 },
    { date: '01/03', likes: 180, comments: 31, shares: 18, impressions: 2100 },
    { date: '01/04', likes: 220, comments: 28, shares: 25, impressions: 2800 },
    { date: '01/05', likes: 195, comments: 35, shares: 22, impressions: 2400 },
    { date: '01/06', likes: 240, comments: 42, shares: 30, impressions: 3200 },
    { date: '01/07', likes: 280, comments: 48, shares: 35, impressions: 3800 },
  ];

  const posts: Post[] = [
    {
      id: '1',
      title: '朝のコーヒータイム',
      content: '今日も素晴らしい一日の始まりです ☕️',
      status: 'published',
      scheduled_time: null,
      media_url: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      engagement: { likes: 45, comments: 8, shares: 3 }
    },
    {
      id: '2',
      title: '新商品の紹介',
      content: '当店の新商品をご紹介します！',
      status: 'scheduled',
      scheduled_time: new Date(Date.now() + 7200000).toISOString(),
      media_url: null,
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    // ... more posts
  ];

  const postStatusData = [
    { name: '公開済み', value: 16, color: '#10B981' },
    { name: '予約済み', value: 8, color: '#F59E0B' },
    { name: '下書き', value: 5, color: '#6B7280' }
  ];

  // Calculate stats from real data
  const analytics = React.useMemo(() => {
    if (!posts.length) return null;
    
    return {
      totalPosts: posts.length,
      scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
      publishedPosts: posts.filter(p => p.status === 'published').length,
      draftPosts: posts.filter(p => p.status === 'draft').length
    };
  }, [posts]);

  useEffect(() => {
    // Card animation with adaptive timing based on device capabilities
    const delay = capabilities.isMobile ? 300 : 500;
    setTimeout(() => setAnimateCards(true), delay);
  }, [capabilities.isMobile]);

  const stats = React.useMemo(() => [
    {
      title: '総投稿数',
      value: analytics?.totalPosts || 0,
      change: dashboard?.stats?.growth?.posts || '+0%',
      changeType: 'increase' as const,
      icon: TrendingUp,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      title: '今月のエンゲージメント',
      value: dashboard?.stats?.engagement?.total || '0',
      change: dashboard?.stats?.growth?.engagement || '+0%',
      changeType: 'increase' as const,
      icon: Heart,
      color: 'from-pink-600 to-rose-600',
    },
    {
      title: '予約済み',
      value: analytics?.scheduledPosts || 0,
      change: `+${analytics?.scheduledPosts || 0}`,
      changeType: 'increase' as const,
      icon: Clock,
      color: 'from-amber-600 to-orange-600',
    },
    {
      title: '今月の成長率',
      value: dashboard?.stats?.growth?.rate || '0%',
      change: dashboard?.stats?.growth?.change || '+0%',
      changeType: 'increase' as const,
      icon: Activity,
      color: 'from-green-600 to-emerald-600',
    },
  ], [analytics, dashboard]);

  // Calendar functionality
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPostsForDay = (date: Date) => {
    return posts.filter(post => {
      if (post.scheduled_time) {
        return isSameDay(new Date(post.scheduled_time), date);
      }
      return isSameDay(new Date(post.created_at), date);
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Loading state
  if (dashboardLoading || postsLoading) {
    return (
      <AdaptiveAnimation animation="fade">
        <div className="space-y-6">
          {/* Loading skeleton */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded mb-2 w-48"></div>
              <div className="h-4 bg-white/20 rounded w-64"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg border p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2 w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdaptiveAnimation>
    );
  }

  return (
    <RealTimeIntegration
      showStatusIndicator={capabilities.isDesktop}
      enableNotifications={preferences.notifications}
      enableOptimisticUpdates={preferences.optimisticUI}
    >
      <EnhancedErrorBoundary
        level="component"
        showDetails={process.env.NODE_ENV === 'development'}
      >
        <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">
              おかえりなさい、{user?.name || 'ユーザー'}さん！
            </h2>
            <p className="text-blue-100 mb-4 text-sm lg:text-base">
              今日も素晴らしいコンテンツで、あなたのInstagramを成長させましょう
            </p>
          </div>
          <motion.button 
            onClick={() => router.push('/create')}
            className="bg-white text-blue-700 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-lg flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>新しい投稿を作成</span>
          </motion.button>
        </div>
      </motion.div>

      {/* View Toggle */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg border p-4"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: '概要', icon: BarChart3 },
            { id: 'calendar', label: 'カレンダー', icon: CalendarIcon },
            { id: 'analytics', label: '分析', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setSelectedView(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                selectedView === id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Overview */}
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate={animateCards ? "visible" : "hidden"}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    variants={cardVariants}
                    className="bg-white rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <div className={`flex items-center mt-2 text-sm ${
                          stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span>{stat.change}</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Charts and Recent Posts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Engagement Chart */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-2 bg-white rounded-xl shadow-lg border p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">エンゲージメント推移</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>いいね</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>コメント</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="likes" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="comments" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Post Status Pie Chart */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-xl shadow-lg border p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">投稿ステータス</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={postStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {postStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {postStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Calendar View */}
        {selectedView === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-xl shadow-lg border p-6"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {format(currentDate, 'yyyy年MM月', { locale: ja })}
              </h3>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  今日
                </motion.button>
                <motion.button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {monthDays.map((day, index) => {
                const dayPosts = getPostsForDay(day);
                const isCurrentDay = isToday(day);
                
                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isCurrentDay 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map((post) => (
                        <div
                          key={post.id}
                          className={`text-xs p-1 rounded text-white text-center truncate ${
                            post.status === 'published' ? 'bg-green-500' :
                            post.status === 'scheduled' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`}
                        >
                          {post.title}
                        </div>
                      ))}
                      {dayPosts.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayPosts.length - 2} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Analytics View */}
        {selectedView === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-xl shadow-lg border p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">インプレッション推移</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="impressions" stroke="#8B5CF6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-xl shadow-lg border p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">エンゲージメント率</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="likes" fill="#3B82F6" />
                    <Bar dataKey="comments" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Top Performing Posts */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-xl shadow-lg border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">パフォーマンス上位投稿</h3>
              <div className="space-y-4">
                {posts.filter(post => post.engagement).slice(0, 5).map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{post.title}</h4>
                      <p className="text-sm text-gray-600 truncate">{post.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.engagement?.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.engagement?.comments}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Share className="w-4 h-4" />
                        <span>{post.engagement?.shares}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </EnhancedErrorBoundary>
    </RealTimeIntegration>
  );
};

export default EnhancedDashboard;