/**
 * Episode Script API Service
 * 分集剧本管理 - 参考 huanu-workbench-frontend 实现
 */

import { apiClient, ApiResponse } from './client'

// Resource 类型 (与 huanu-workbench-frontend 一致)
export interface Resource {
  id: number
  resourceName: string
  resourceContent?: string
  resourceStatus?: string
  resourceType?: string
  projectId: number
  userId?: number
  createdBy?: string | number
  updatedBy?: string | number
  createdTime?: string
  updatedTime?: string
}

// Episode 类型 (前端使用)
export interface Episode {
  id: number
  title: string
  content: string
  resourceName: string
}

// API 响应格式
export interface EpisodeScriptResponse {
  episodes: Episode[]
  totalEpisodes: number
  originalContent: string
}

export const episodeScriptApi = {
  /**
   * 创建分集剧本 - POST /api/episode-script
   */
  create: async (
    name: string,
    content: object,
    projectId: number,
    userId?: number
  ): Promise<ApiResponse<Resource>> => {
    const now = new Date().toISOString()
    const body = {
      resourceName: name,
      resourceType: 'episode_script',
      resourceContent: JSON.stringify(content),
      resourceStatus: 'draft',
      projectId,
      userId: userId || 1,
      createdBy: 'admin',
      updatedBy: 'admin',
      createdTime: now,
      updatedTime: now,
      status: 1,
    }
    const response = await apiClient.post('/episode-script', body)
    return response.data
  },

  /**
   * 获取分集剧本列表 - GET /api/episode-script/list
   */
  getList: async (projectId: number): Promise<ApiResponse<Resource[]>> => {
    const response = await apiClient.get('/episode-script/list', { params: { projectId } })
    return response.data
  },

  /**
   * 获取单个分集剧本 - GET /api/episode-script/{id}
   */
  getById: async (id: number): Promise<ApiResponse<Resource>> => {
    const response = await apiClient.get(`/episode-script/${id}`)
    return response.data
  },

  /**
   * 更新分集剧本 - PUT /api/episode-script/{id}
   */
  update: async (
    id: number,
    content: object
  ): Promise<ApiResponse<Resource>> => {
    const now = new Date().toISOString()
    const body = {
      resourceContent: JSON.stringify(content),
      resourceStatus: 'draft',
      updatedTime: now,
    }
    const response = await apiClient.put(`/episode-script/${id}`, body)
    return response.data
  },

  /**
   * 删除分集剧本 - DELETE /api/episode-script/{id}
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/episode-script/${id}`)
    return response.data
  },
}
