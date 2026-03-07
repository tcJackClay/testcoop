/**
 * Grid Storyboard API Service
 * 九宫格分镜管理 - 九宫格分镜的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Grid Storyboard types
export interface GridStoryboard {
  id: number
  name: string
  content: string
  storyboardScriptId?: number
  projectId?: number
  userId: number
  createTime?: string
  updateTime?: string
}

export interface CreateGridStoryboardRequest {
  name: string
  content: string
  storyboardScriptId?: number
  projectId?: number
}

export interface UpdateGridStoryboardRequest {
  name?: string
  content?: string
}

export const gridStoryboardApi = {
  /**
   * 获取所有九宫格分镜
   */
  getAll: async (storyboardScriptId?: number, projectId?: number): Promise<ApiResponse<GridStoryboard[]>> => {
    const params: Record<string, number> = {}
    if (storyboardScriptId) params.storyboardScriptId = storyboardScriptId
    if (projectId) params.projectId = projectId
    const response = await apiClient.get('/api/grid-storyboard', { params })
    return response.data
  },

  /**
   * 根据ID获取九宫格分镜
   */
  getById: async (id: number): Promise<ApiResponse<GridStoryboard>> => {
    const response = await apiClient.get(`/api/grid-storyboard/${id}`)
    return response.data
  },

  /**
   * 创建九宫格分镜
   */
  create: async (data: CreateGridStoryboardRequest): Promise<ApiResponse<GridStoryboard>> => {
    const response = await apiClient.post('/api/grid-storyboard', data)
    return response.data
  },

  /**
   * 更新九宫格分镜
   */
  update: async (id: number, data: UpdateGridStoryboardRequest): Promise<ApiResponse<GridStoryboard>> => {
    const response = await apiClient.put(`/api/grid-storyboard/${id}`, data)
    return response.data
  },

  /**
   * 删除九宫格分镜
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/grid-storyboard/${id}`)
    return response.data
  },
}
