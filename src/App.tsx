// src/App.tsx - 应用入口（路由版本）
import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './stores/authStore';

// 导出 ViewMode 类型供其他组件使用
export type ViewMode = 'login' | 'canvas' | 'storyboard' | 'history' | 'models' | 'projects';

// 获取初始用户
const getInitialUser = (): any => {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export default function App() {
  const fetchCurrentUser = useAuthStore(state => state.fetchCurrentUser);
  const user = useAuthStore(state => state.user);
  const [isReady, setIsReady] = useState(false);
  
  // 等待 hydration 后验证登录状态
  useEffect(() => {
    // 检查是否有 token
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = getInitialUser();
    
    if (storedToken && !user && !storedUser) {
      // 有token但没有用户信息，尝试获取
      fetchCurrentUser().finally(() => setIsReady(true));
    } else if (storedUser && !user) {
      // 有存储的用户信息，直接设置
      useAuthStore.setState({ user: storedUser });
      setIsReady(true);
    } else {
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
