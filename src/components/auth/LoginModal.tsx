import { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

type Mode = 'login' | 'register';

export default function LoginModal() {
  const { 
    isLoginModalOpen, 
    closeLoginModal, 
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

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isLoginModalOpen) {
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setLocalError('');
      clearError();
    }
  }, [isLoginModalOpen, mode, clearError]);

  if (!isLoginModalOpen) return null;

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
        setLocalError('两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        setLocalError('密码长度至少为6位');
        return;
      }

      const success = await register({ username, email, password });
      if (!success) {
        // Error is handled by store
      }
    } else {
      const success = await login({ username, password });
      if (!success) {
        // Error is handled by store
      }
    }
  };

  const displayError = localError || error || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeLoginModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'login' ? '登录' : '注册'}
          </h2>
          <button
            onClick={closeLoginModal}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {displayError && (
            <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg">
              {displayError}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入用户名"
              disabled={isLoading}
            />
          </div>

          {/* Email (register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入邮箱"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入密码"
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请再次输入密码"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                登录
              </>
            ) : (
              <>
                <UserPlus size={18} />
                注册
              </>
            )}
          </button>

          {/* Switch Mode */}
          <div className="text-center text-sm text-gray-400">
            {mode === 'login' ? (
              <>
                还没有账号？{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账号？{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  立即登录
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
