/**
 * Config API Service
 * API配置管理 - RunningHub和VectorAPI配置的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Config types
export interface ApiConfig {
  id: number
  name: string
  type: 'runninghub' | 'vector'
  config: Record<string, string>
  status: number
  userId: number
  createTime?: string
  updateTime?: string
}

export interface CreateApiConfigRequest {
  name: string
  type: 'runninghub' | 'vector'
  config: Record<string, string>
}

export interface UpdateApiConfigRequest {
  name?: string
  config?: Record<string, string>
  status?: number
}

export const configApi = {
  /**
   * 获取所有API配置
   */
  getAll: async (type?: string): Promise<ApiResponse<ApiConfig[]>> => {
    const params = type ? { type } : {}
    const response = await apiClient.get('/api/config', { params })
    return response.data
  },

  /**
   * 根据ID获取API配置
   */
  getById: async (id: number): Promise<ApiResponse<ApiConfig>> => {
    const response = await apiClient.get(`/api/config/${id}`)
    return response.data
  },

  /**
   * 创建API配置
   */
  create: async (data: CreateApiConfigRequest): Promise<ApiResponse<ApiConfig>> => {
    const response = await apiClient.post('/api/config', data)
    return response.data
  },

  /**
   * 更新API配置
   */
  update: async (id: number, data: UpdateApiConfigRequest): Promise<ApiResponse<ApiConfig>> => {
    const response = await apiClient.put(`/api/config/${id}`, data)
    return response.data
  },

  /**
   * 删除API配置
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/config/${id}`)
    return response.data
  },

  /**
   * 测试API配置
   */
  test: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.post(`/api/config/${id}/test`)
    return response.data
  },
}
