/**
 * Prompt API Service
 * 提示词管理 - 提示词的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Prompt types
export interface Prompt {
  id: number
  name: string
  content: string
  type?: number
  projectId?: number
  userId: number
  createTime?: string
  updateTime?: string
}

export interface CreatePromptRequest {
  name: string
  content: string
  type?: number
  projectId?: number
}

export interface UpdatePromptRequest {
  name?: string
  content?: string
  type?: number
}

export const promptApi = {
  /**
   * 获取所有提示词
   */
  getAll: async (projectId?: number): Promise<ApiResponse<Prompt[]>> => {
    const params = projectId ? { projectId } : {}
    const response = await apiClient.get('/api/prompt', { params })
    return response.data
  },

  /**
   * 根据ID获取提示词
   */
  getById: async (id: number): Promise<ApiResponse<Prompt>> => {
    const response = await apiClient.get(`/api/prompt/${id}`)
    return response.data
  },

  /**
   * 创建提示词
   */
  create: async (data: CreatePromptRequest): Promise<ApiResponse<Prompt>> => {
    const response = await apiClient.post('/api/prompt', data)
    return response.data
  },

  /**
   * 更新提示词
   */
  update: async (id: number, data: UpdatePromptRequest): Promise<ApiResponse<Prompt>> => {
    const response = await apiClient.put(`/api/prompt/${id}`, data)
    return response.data
  },

  /**
   * 删除提示词
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/prompt/${id}`)
    return response.data
  },
}
