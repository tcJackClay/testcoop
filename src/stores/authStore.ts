import { create } from 'zustand';
import { authApi, LoginRequest, RegisterRequest } from '../api/auth';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  error: string | null;
  isDevMode: boolean;

  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  clearError: () => void;
  toggleDevMode: () => void;
}

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getInitialToken(),
  user: null,
  isLoading: false,
  isLoginModalOpen: false,
  error: null,
  isDevMode: false,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await authApi.login(data);
      
      if (response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
        set({ 
          token: response.data.token, 
          user: response.data.user || null, 
          isLoading: false, 
          isLoginModalOpen: false 
        });
        // 登录成功，触发事件通知
        window.dispatchEvent(new CustomEvent('auth:login-success'));
        return true;
      } else {
        set({ error: response.message || '登录失败', isLoading: false });
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || '登录失败，请稍后重试';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await authApi.register(data);
      
      if (response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
        set({ 
          token: response.data.token, 
          user: response.data.user || null, 
          isLoading: false, 
          isLoginModalOpen: false 
        });
        // 注册成功，用户信息已从注册响应获取
        return true;
        return true;
      } else {
        set({ error: response.message || '注册失败', isLoading: false });
        return false;
      }
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.message || error.message || '注册失败，请稍后重试';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('auth_token');
      set({ token: null, user: null, isDevMode: false });
    }
  },

  fetchCurrentUser: async () => {
    const token = get().token;
    if (!token) {
      set({ user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response: any = await authApi.getCurrentUser();
      const user = response.data || response;
      if (user?.id) {
        set({ user, isLoading: false });
      } else {
        localStorage.removeItem('auth_token');
        set({ token: null, user: null, isLoading: false, isDevMode: false });
      }
    } catch (error: any) {
      // 如果是 404（后端没有 /auth/me 接口），不清除 token
      // 因为登录响应已经包含了用户信息
      if (error.response?.status === 404) {
        set({ isLoading: false });
        return;
      }
      // 其他错误（401 等）清除 token
      localStorage.removeItem('auth_token');
      set({ token: null, user: null, isLoading: false, isDevMode: false });
    }
  },

  openLoginModal: () => set({ isLoginModalOpen: true, error: null }),
  closeLoginModal: () => set({ isLoginModalOpen: false, error: null }),
  clearError: () => set({ error: null }),
  
  toggleDevMode: () => {
    const { user, isDevMode } = get();
    if (user?.username === 'admin') {
      const newMode = !isDevMode;
      if (newMode) {
        localStorage.setItem('dev_mode', 'true');
      } else {
        localStorage.removeItem('dev_mode');
      }
      set({ isDevMode: newMode });
    }
  },
}));
