/**
 * Episode Script API Service
 * 分集剧本管理 - 分集剧本的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Episode Script types
export interface EpisodeScript {
  id: number
  name: string
  content: string
  episodeNumber: number
  scriptId?: number
  projectId?: number
  userId: number
  status: number
  createTime?: string
  updateTime?: string
}

export interface CreateEpisodeScriptRequest {
  name: string
  content: string
  episodeNumber: number
  scriptId?: number
  projectId?: number
}

export interface UpdateEpisodeScriptRequest {
  name?: string
  content?: string
  episodeNumber?: number
  status?: number
}

export const episodeScriptApi = {
  /**
   * 获取所有分集剧本
   */
  getAll: async (scriptId?: number, projectId?: number): Promise<ApiResponse<EpisodeScript[]>> => {
    const params: Record<string, number> = {}
    if (scriptId) params.scriptId = scriptId
    if (projectId) params.projectId = projectId
    const response = await apiClient.get('/api/episode-script', { params })
    return response.data
  },

  /**
   * 根据ID获取分集剧本
   */
  getById: async (id: number): Promise<ApiResponse<EpisodeScript>> => {
    const response = await apiClient.get(`/api/episode-script/${id}`)
    return response.data
  },

  /**
   * 创建分集剧本
   */
  create: async (data: CreateEpisodeScriptRequest): Promise<ApiResponse<EpisodeScript>> => {
    const response = await apiClient.post('/api/episode-script', data)
    return response.data
  },

  /**
   * 更新分集剧本
   */
  update: async (id: number, data: UpdateEpisodeScriptRequest): Promise<ApiResponse<EpisodeScript>> => {
    const response = await apiClient.put(`/api/episode-script/${id}`, data)
    return response.data
  },

  /**
   * 删除分集剧本
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/episode-script/${id}`)
    return response.data
  },
}
