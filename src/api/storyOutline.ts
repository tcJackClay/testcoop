/**
 * Story Outline API Service
 * 故事大纲管理 - 故事大纲的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Story Outline types
export interface StoryOutline {
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

export interface CreateStoryOutlineRequest {
  name: string
  content: string
  scriptId?: number
  projectId?: number
}

export interface UpdateStoryOutlineRequest {
  name?: string
  content?: string
  status?: number
}

export const storyOutlineApi = {
  /**
   * 获取所有故事大纲
   */
  getAll: async (scriptId?: number, projectId?: number): Promise<ApiResponse<StoryOutline[]>> => {
    const params: Record<string, number> = {}
    if (scriptId) params.scriptId = scriptId
    if (projectId) params.projectId = projectId
    const response = await apiClient.get('/api/story-outline', { params })
    return response.data
  },

  /**
   * 根据ID获取故事大纲
   */
  getById: async (id: number): Promise<ApiResponse<StoryOutline>> => {
    const response = await apiClient.get(`/api/story-outline/${id}`)
    return response.data
  },

  /**
   * 创建故事大纲
   */
  create: async (data: CreateStoryOutlineRequest): Promise<ApiResponse<StoryOutline>> => {
    const response = await apiClient.post('/api/story-outline', data)
    return response.data
  },

  /**
   * 更新故事大纲
   */
  update: async (id: number, data: UpdateStoryOutlineRequest): Promise<ApiResponse<StoryOutline>> => {
    const response = await apiClient.put(`/api/story-outline/${id}`, data)
    return response.data
  },

  /**
   * 删除故事大纲
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/story-outline/${id}`)
    return response.data
  },

  /**
   * 故事大纲特殊操作
   */
  operate: async (id: number, data: Record<string, unknown>): Promise<ApiResponse<StoryOutline>> => {
    const response = await apiClient.post(`/api/story-outline/${id}/operate`, data)
    return response.data
  },

  /**
   * 提交故事大纲审批
   */
  commit: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/story-outline/${id}/commit`)
    return response.data
  },
}
