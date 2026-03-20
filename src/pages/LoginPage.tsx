// src/pages/LoginPage.tsx - 登录页面
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    login,
    isLoading,
    error,
    clearError,
    user
  } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // 如果已登录，跳转到项目列表（只在初始化时检查一次）
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/projects', { replace: true });
    }
  }, []);

  // Reset form when component mounts
  useEffect(() => {
    setUsername('');
    setPassword('');
    setLocalError('');
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!username.trim() || !password.trim()) {
      setLocalError('请填写用户名和密码');
      return;
    }

    try {
      const success = await login({ username, password });
      if (success) {
        navigate('/projects', { replace: true });
      }
    } catch (err) {
      // Error is handled by authStore
    }
  };

  const displayError = localError || error || '';

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-20 h-20 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-white">AIGC 协作平台</h1>
            <p className="text-gray-400 mt-2">
              登录您的账户
            </p>
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
                  登录中...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  登录
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
