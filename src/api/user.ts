/**
 * User API Service
 * 用户管理 - 用户查询、修改、删除等
 */

import { apiClient, ApiResponse } from './client'

// User types
export interface UserDTO {
  id: number
  username: string
  email: string
  role: string
  status: number
  createTime?: string
  updateTime?: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role?: string
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  role?: string
  status?: number
}

export const userApi = {
  /**
   * 获取所有用户
   */
  getAll: async (): Promise<ApiResponse<UserDTO[]>> => {
    const response = await apiClient.get('/api/users')
    return response.data
  },

  /**
   * 根据ID获取用户
   */
  getById: async (id: number): Promise<ApiResponse<UserDTO>> => {
    const response = await apiClient.get(`/api/users/${id}`)
    return response.data
  },

  /**
   * 创建用户
   */
  create: async (data: CreateUserRequest): Promise<ApiResponse<UserDTO>> => {
    const response = await apiClient.post('/api/users', data)
    return response.data
  },

  /**
   * 更新用户
   */
  update: async (id: number, data: UpdateUserRequest): Promise<ApiResponse<UserDTO>> => {
    const response = await apiClient.put(`/api/users/${id}`, data)
    return response.data
  },

  /**
   * 删除用户
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/users/${id}`)
    return response.data
  },
}
