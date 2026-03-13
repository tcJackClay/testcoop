// src/App.tsx - 应用入口（路由版本）
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './stores/authStore';

// 导出 ViewMode 类型供其他组件使用
export type ViewMode = 'login' | 'canvas' | 'storyboard' | 'history' | 'models' | 'projects';

export default function App() {
  const fetchCurrentUser = useAuthStore(state => state.fetchCurrentUser);
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  
  // 初始化：验证 token 并获取用户信息
  // 使用独立的标志位确保只执行一次
  useEffect(() => {
    // 如果有 token 但没有 user，尝试获取用户信息
    if (token && !user) {
      fetchCurrentUser();
    }
  }, []); // 只在挂载时执行一次

  return <RouterProvider router={router} />;
}
