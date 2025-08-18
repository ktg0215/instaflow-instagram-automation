import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import { Zap } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: PostgreSQL実装に変更
    setUser(null);
    setLoading(false);
    
    // 一時的にSupabase関連機能を無効化
    // // Get initial session
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setUser(session?.user ?? null);
    //   setLoading(false);
    // });

    // // Listen for auth changes
    // const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    //   setUser(session?.user ?? null);
    //   setLoading(false);
    // });

    // return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-cyan-200 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-cyan-200 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">InstaFlow</h1>
            <p className="text-gray-700">AI搭載Instagram管理ツール</p>
          </div>

          {/* Auth Form */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-blue-300">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                ログイン
              </h2>
              <p className="text-gray-600 mt-1">
                アカウントにログインしてください
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;