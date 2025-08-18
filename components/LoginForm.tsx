import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, User, UserPlus } from 'lucide-react';
// NOTE: Supabase は未使用

interface LoginFormProps {
  initialMode?: 'login' | 'signup';
}

const LoginForm: React.FC<LoginFormProps> = ({ initialMode = 'login' }) => {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // コンポーネントマウント時にフォームをクリア（ブラウザキャッシュ対策）
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // NextAuth Google OAuth を使用
      const { signIn } = await import('next-auth/react');
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false 
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      if (result?.ok) {
        setSuccess('Googleアカウントでのログインが成功しました。リダイレクト中...');
        // 成功した場合は自動的にリダイレクト
        window.location.href = '/dashboard';
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('OAuthCallback') || err.message.includes('Configuration')) {
          setError('Google認証の設定に問題があります。管理者にお問い合わせください。');
        } else {
          setError(`Google認証エラー: ${err.message}`);
        }
      } else {
        setError('Google認証に失敗しました。再度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error('パスワードが一致しません');
        }
        if (password.length < 6) {
          throw new Error('パスワードは6文字以上で設定してください');
        }
        await signUp(email, password);
        setSuccess('アカウントが作成されました！自動的にログインします...');
        // アカウント作成成功後、ダッシュボードにリダイレクト
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials') || 
            err.message.includes('invalid_credentials') || 
            err.message.includes('Invalid user credentials')) {
          setError('このメールアドレスとパスワードでのログインに失敗しました。新しいアカウントを作成してください。');
        } else if (err.message.includes('User already registered')) {
          setError('このメールアドレスは既に登録されています。ログインを試してください。');
        } else {
          setError(err.message);
        }
      } else {
        setError('認証に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">IF</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isLogin ? 'おかえりなさい' : 'はじめましょう'}
        </h1>
        <p className="text-gray-500 text-sm">
          {isLogin 
            ? 'InstaFlow にログインして続行' 
            : 'アカウントを作成して開始'
          }
        </p>
      </div>


      {error && (
        <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-red-700 text-sm font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-green-700 text-sm font-medium">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            メールアドレス
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="email" aria-label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-gray-900"
              placeholder="your@example.com"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              name="email-input"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            パスワード
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-gray-900"
              placeholder="••••••••"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              name="password-input"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors rounded-lg"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              パスワード確認
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-gray-900"
                placeholder="••••••••"
                autoComplete="off"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors rounded-lg"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {!isLogin && password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1 ml-1">パスワードが一致しません</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              処理中...
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>{isLogin ? 'ログイン' : 'アカウント作成'}</span>
            </div>
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 bg-white text-gray-400 font-medium">または</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-4 rounded-2xl font-medium hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleで{isLogin ? 'ログイン' : 'アカウント作成'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          type="button"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          {isLogin 
            ? 'アカウントをお持ちでない方はこちら' 
            : '既にアカウントをお持ちの方はこちら'
          }
        </button>
      </div>

    </div>
  );
};

export default LoginForm;