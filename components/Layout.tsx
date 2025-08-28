"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
import { Home, PlusCircle, Calendar, Settings, Zap, BarChart3, Menu, X, CreditCard, Code } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import LoadingSkeleton from './LoadingSkeleton';

interface LayoutProps {
  children: React.ReactNode;
  currentView?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView = 'dashboard' }) => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { profile: instagramProfile, isConnected } = useInstagram(user?.id ? String(user.id) : undefined);
  const [mounted, setMounted] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  const navItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: Home, path: '/dashboard' },
    { id: 'create', label: '投稿作成', icon: PlusCircle, path: '/create' },
    { id: 'ai', label: 'AI Studio', icon: Zap, path: '/ai' },
    { id: 'schedule', label: 'スケジュール', icon: Calendar, path: '/schedule' },
    { id: 'analytics', label: '分析', icon: BarChart3, path: '/analytics' },
    { id: 'pricing', label: '料金プラン', icon: CreditCard, path: '/pricing' },
    { id: 'demo', label: '新機能デモ', icon: Code, path: '/demo' },
    { id: 'settings', label: '設定', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-50">
      {/* Header */}
      <header className="bg-blue-700/95 backdrop-blur-sm shadow-lg border-b border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden mr-3 p-2 rounded-lg hover:bg-blue-600 text-white transition-colors"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">InstaFlow</h1>
                <p className="text-sm text-blue-200 hidden sm:block">AI搭載Instagram管理ツール</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {isConnected && instagramProfile 
                      ? instagramProfile.username.charAt(0).toUpperCase()
                      : 'U'
                    }
                  </span>
                </div>
                <span className="text-sm font-medium text-white">
                  {isConnected && instagramProfile 
                    ? `@${instagramProfile.username}`
                    : 'ユーザー'
                  }
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                    router.push('/');
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="px-2 py-1 sm:px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 bg-blue-600/95 backdrop-blur-sm shadow-lg h-screen sticky top-0 border-r border-blue-500
          fixed lg:static z-50 lg:z-auto transition-transform duration-300 ease-in-out
        `}>
          <div className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        router.push(item.path);
                        setIsSidebarOpen(false); // Close mobile menu after navigation
                      }}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                        currentView === item.id
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                          : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6 bg-blue-50 lg:ml-0">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;