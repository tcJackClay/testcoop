/**
 * Auth API Service
 * 认证管理 - 用户登录、注册等
 */

import { apiClient, ApiResponse } from './client'

// Auth types
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    email: string
    role: string
  }
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export const authApi = {
  /**
   * 用户登录
   */
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  /**
   * 用户注册
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  /**
   * 登出
   */
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  /**
   * 刷新Token
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken })
    return response.data
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: async (): Promise<ApiResponse<LoginResponse['user']>> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}
