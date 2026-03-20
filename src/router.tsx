// src/router.tsx - 路由配置
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect, useState, ReactNode, useRef, lazy, Suspense } from 'react';

// 页面组件（懒加载 - 代码分割）
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const CanvasPage = lazy(() => import('./pages/CanvasPage'));

// 懒加载加载组件
function PageLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-dark-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">加载中...</span>
      </div>
    </div>
  );
}

// 懒加载包装组件
function LazyWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

// 检查是否有 token（直接从 localStorage）
const hasToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
};

// 路由守卫组件 - 保护需要登录的页面
function ProtectedRoute({ children }: { children: ReactNode }) {
  // 直接从 localStorage 检查，避免 zustand 初始化问题
  const token = localStorage.getItem('auth_token');
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // 同步 user 到 store
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        const storedUser = JSON.parse(userStr);
        useAuthStore.setState({ user: storedUser, token: token });
      } catch {}
    }
    setIsReady(true);
  }, [token]);
  
  // 如果没有 token，跳转到登录页
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // 等待初始化完成
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
  // 如果已有登录状态（从 localStorage），跳转到项目页
  if (localStorage.getItem('auth_token')) {
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
        <LazyWrapper>
          <LoginPage />
        </LazyWrapper>
      </PublicRoute>
    ),
  },
  {
    path: '/projects',
    element: (
      <ProtectedRoute>
        <LazyWrapper>
          <ProjectsPage />
        </LazyWrapper>
      </ProtectedRoute>
    )
  },
  {
    path: '/canvas',
    element: (
      <ProtectedRoute>
        <LazyWrapper>
          <CanvasPage />
        </LazyWrapper>
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
