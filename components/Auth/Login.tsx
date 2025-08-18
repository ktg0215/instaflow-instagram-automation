import React, { useState } from 'react';
import { Zap } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const action = isSignUp ? 'signup' : 'signin';
      window.location.href = `/api/auth/google?action=${action}`;
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError('Google認証の開始に失敗しました');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('パスワードが一致しません');
        }
        if (password.length < 6) {
          throw new Error('パスワードは6文字以上で設定してください');
        }
        
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'アカウント作成に失敗しました');
        }

        const { user, token } = await response.json();
        localStorage.setItem('auth_token', token);
        setSuccess('アカウントが作成されました！');
      } else {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'ログインに失敗しました');
        }

        const { user, token } = await response.json();
        localStorage.setItem('auth_token', token);
        setSuccess('ログインに成功しました！');
      }
      
      setTimeout(() => {
        onLogin();
      }, 1000);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません');
        } else if (err.message.includes('User already registered')) {
          setError('このメールアドレスは既に登録されています');
        } else {
          setError(err.message);
        }
      } else {
        setError('認証に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-cyan-200 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo Section */}
          <div className="text-center mb-8 relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">InstaFlow</h1>
            <p className="text-gray-700">AI搭載Instagram管理ツール</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-300">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isSignUp ? 'アカウント作成' : 'ログイン'}
              </h2>
              <p className="text-gray-600 mt-1">
                {isSignUp 
                  ? '新しいアカウントを作成してください' 
                  : 'アカウントにログインしてください'
                }
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/90"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/90"
                  placeholder="••••••••"
                  required
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード確認
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/90"
                    placeholder="••••••••"
                    required={isSignUp}
                    minLength={6}
                  />
                  {isSignUp && password && confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">パスワードが一致しません</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ログイン中...
                  </div>
                ) : (
                  isSignUp ? 'アカウント作成' : 'ログイン'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleで{isSignUp ? 'アカウント作成' : 'ログイン'}
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでない場合は'}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp 
                  ? 'ログインはこちら' 
                  : 'アカウント作成はこちら'
                }
              </button>
            </p>
          </div>
        </div>
      </div>
  );
};

export default Login;