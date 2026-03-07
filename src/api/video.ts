/**
 * Video API Service
 * 视频管理 - 视频的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Video types
export interface Video {
  id: number
  name: string
  url: string
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
  size?: number
  format?: string
  status: number
  projectId?: number
  userId: number
  createTime?: string
  updateTime?: string
}

export interface CreateVideoRequest {
  name: string
  url: string
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
  size?: number
  format?: string
  projectId?: number
}

export interface UpdateVideoRequest {
  name?: string
  url?: string
  thumbnailUrl?: string
  status?: number
}

export const videoApi = {
  /**
   * 获取所有视频
   */
  getAll: async (projectId?: number): Promise<ApiResponse<Video[]>> => {
    const params = projectId ? { projectId } : {}
    const response = await apiClient.get('/api/video', { params })
    return response.data
  },

  /**
   * 根据ID获取视频
   */
  getById: async (id: number): Promise<ApiResponse<Video>> => {
    const response = await apiClient.get(`/api/video/${id}`)
    return response.data
  },

  /**
   * 创建视频
   */
  create: async (data: CreateVideoRequest): Promise<ApiResponse<Video>> => {
    const response = await apiClient.post('/api/video', data)
    return response.data
  },

  /**
   * 更新视频
   */
  update: async (id: number, data: UpdateVideoRequest): Promise<ApiResponse<Video>> => {
    const response = await apiClient.put(`/api/video/${id}`, data)
    return response.data
  },

  /**
   * 删除视频
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/video/${id}`)
    return response.data
  },

  /**
   * 视频特殊操作
   */
  operate: async (id: number, data: Record<string, unknown>): Promise<ApiResponse<Video>> => {
    const response = await apiClient.post(`/api/video/${id}/operate`, data)
    return response.data
  },

  /**
   * 提交视频审批
   */
  commit: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/video/${id}/commit`)
    return response.data
  },
}
