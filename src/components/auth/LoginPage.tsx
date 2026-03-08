// LoginPage - 独立登录页面
import { useState, useEffect } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const {
    login,
    register,
    isLoading,
    error,
    clearError
  } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Reset form when mode changes
  useEffect(() => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLocalError('');
    clearError();
  }, [mode, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!username.trim() || !password.trim()) {
      setLocalError('请填写用户名和密码');
      return;
    }

    if (mode === 'register') {
      if (!email.trim()) {
        setLocalError('请填写邮箱');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('两次密码不一致');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      // Error is handled by authStore
    }
  };

  const displayError = localError || error || '';

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">AIGC 协作平台</h1>
          <p className="text-gray-400 mt-2">
            {mode === 'login' ? '登录您的账户' : '创建新账户'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            注册
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="请输入用户名"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="请输入邮箱"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="请输入密码"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="请再次输入密码"
              />
            </div>
          )}

          {displayError && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {mode === 'login' ? '登录' : '注册'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
