/**
 * System Prompt API Service
 * 系统提示词管理 - 系统提示词的增删改查
 */

import { apiClient, ApiResponse } from './client'

// System Prompt types
export interface SystemPrompt {
  id: number
  name: string
  content: string
  status: number
  userId: number
  createTime?: string
  updateTime?: string
}

export interface CreateSystemPromptRequest {
  name: string
  content: string
}

export interface UpdateSystemPromptRequest {
  name?: string
  content?: string
  status?: number
}

export const systemPromptApi = {
  /**
   * 获取所有系统提示词
   */
  getAll: async (): Promise<ApiResponse<SystemPrompt[]>> => {
    const response = await apiClient.get('/api/system-prompt')
    return response.data
  },

  /**
   * 根据ID获取系统提示词
   */
  getById: async (id: number): Promise<ApiResponse<SystemPrompt>> => {
    const response = await apiClient.get(`/api/system-prompt/${id}`)
    return response.data
  },

  /**
   * 创建系统提示词
   */
  create: async (data: CreateSystemPromptRequest): Promise<ApiResponse<SystemPrompt>> => {
    const response = await apiClient.post('/api/system-prompt', data)
    return response.data
  },

  /**
   * 更新系统提示词
   */
  update: async (id: number, data: UpdateSystemPromptRequest): Promise<ApiResponse<SystemPrompt>> => {
    const response = await apiClient.put(`/api/system-prompt/${id}`, data)
    return response.data
  },

  /**
   * 删除系统提示词
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/system-prompt/${id}`)
    return response.data
  },

  /**
   * 启用/禁用系统提示词
   */
  updateStatus: async (id: number, status: number): Promise<ApiResponse<SystemPrompt>> => {
    const response = await apiClient.put(`/api/system-prompt/${id}/status?status=${status}`)
    return response.data
  },
}
