// src/router.tsx - 路由配置
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect, useState, ReactNode, useRef } from 'react';

// 页面组件（直接导入）
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import CanvasPage from './pages/CanvasPage';

// 检查是否有 token（直接从 localStorage）
const hasToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
};

// 路由守卫组件 - 保护需要登录的页面
function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  const [isReady, setIsReady] = useState(false);
  const initialized = useRef(false);
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // 如果 localStorage 有 token，尝试获取用户信息
    if (hasToken() && !user) {
      useAuthStore.getState().fetchCurrentUser().finally(() => {
        setIsReady(true);
      });
    } else {
      setIsReady(true);
    }
  }, []);
  
  // 如果没有 token，直接跳转到登录页
  if (!hasToken()) {
    return <Navigate to="/login" replace />;
  }
  
  // 等待用户信息加载完成
  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">加载中...</div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// 公开路由（已登录用户访问自动跳转）
function PublicRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  
  // 如果已有登录状态，跳转到项目页
  if (hasToken() && user) {
    return <Navigate to="/projects" replace />;
  }
  
  return <>{children}</>;
}

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/projects',
    element: (
      <ProtectedRoute>
        <ProjectsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/canvas',
    element: (
      <ProtectedRoute>
        <CanvasPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/',
    element: <Navigate to="/projects" replace />
  },
  {
    path: '*',
    element: <Navigate to="/projects" replace />
  }
]);

export default router;
