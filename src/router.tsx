import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const CanvasPage = lazy(() => import('./pages/CanvasPage'));

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

function LazyWrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('auth_token');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        const storedUser = JSON.parse(userStr);
        useAuthStore.setState({ user: storedUser, token });
      } catch {
        // Ignore invalid cached user data.
      }
    }
    setIsReady(true);
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  if (localStorage.getItem('auth_token')) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}

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
    ),
  },
  {
    path: '/canvas',
    element: (
      <ProtectedRoute>
        <LazyWrapper>
          <CanvasPage />
        </LazyWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/projects" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/projects" replace />,
  },
]);

export default router;
