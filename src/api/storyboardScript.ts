/**
 * Storyboard Script API Service
 * 分镜脚本管理 - 分镜脚本的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Storyboard Script types
export interface StoryboardScript {
  id: number
  name: string
  content: string
  scriptId?: number
  projectId?: number
  userId: number
  status: number
  createTime?: string
  updateTime?: string
}

export interface CreateStoryboardScriptRequest {
  name: string
  content: string
  scriptId?: number
  projectId?: number
}

export interface UpdateStoryboardScriptRequest {
  name?: string
  content?: string
  status?: number
}

export const storyboardScriptApi = {
  /**
   * 获取所有分镜脚本
   */
  getAll: async (scriptId?: number, projectId?: number): Promise<ApiResponse<StoryboardScript[]>> => {
    const params: Record<string, number> = {}
    if (scriptId) params.scriptId = scriptId
    if (projectId) params.projectId = projectId
    const response = await apiClient.get('/api/storyboard-script', { params })
    return response.data
  },

  /**
   * 根据ID获取分镜脚本
   */
  getById: async (id: number): Promise<ApiResponse<StoryboardScript>> => {
    const response = await apiClient.get(`/api/storyboard-script/${id}`)
    return response.data
  },

  /**
   * 创建分镜脚本
   */
  create: async (data: CreateStoryboardScriptRequest): Promise<ApiResponse<StoryboardScript>> => {
    const response = await apiClient.post('/api/storyboard-script', data)
    return response.data
  },

  /**
   * 更新分镜脚本
   */
  update: async (id: number, data: UpdateStoryboardScriptRequest): Promise<ApiResponse<StoryboardScript>> => {
    const response = await apiClient.put(`/api/storyboard-script/${id}`, data)
    return response.data
  },

  /**
   * 删除分镜脚本
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/storyboard-script/${id}`)
    return response.data
  },

  /**
   * 分镜脚本特殊操作
   */
  operate: async (id: number, data: Record<string, unknown>): Promise<ApiResponse<StoryboardScript>> => {
    const response = await apiClient.post(`/api/storyboard-script/${id}/operate`, data)
    return response.data
  },

  /**
   * 提交分镜脚本审批
   */
  commit: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/storyboard-script/${id}/commit`)
    return response.data
  },
}
