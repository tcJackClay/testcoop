import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterTab() {
  const { user } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim()) {
      setError('请填写用户名');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('请先登录管理员账号');
      return;
    }
    
    setLoading(true);
    setSuccess(false);
    
    try {
      // 使用管理员创建用户接口 /api/users
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password,
          name: username,
          email: '',
          phone: '',
          avatar: '',
          roleIds: [1],
        }),
      });
      
      const result = await response.json();
      console.log('注册响应:', response.status, result);
      
      if (response.ok && (result.code === 0 || result.success)) {
        setSuccess(true);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.msg || result.message || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('注册错误:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">注册新用户</h3>
      
      {!user ? (
        <p className="text-xs text-yellow-400">请先登录管理员账号</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              placeholder="至少6位"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              placeholder="请再次输入密码"
              required
            />
          </div>
          
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-green-400">注册成功！</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
      )}
    </div>
  );
}
