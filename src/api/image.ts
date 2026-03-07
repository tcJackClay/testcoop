/**
 * Image API Service
 * 图片管理 - 图片的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Image types
export interface Image {
  id: number
  name: string
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  size?: number
  format?: string
  projectId?: number
  userId: number
  createTime?: string
  updateTime?: string
}

export interface CreateImageRequest {
  name: string
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  size?: number
  format?: string
  projectId?: number
}

export interface UpdateImageRequest {
  name?: string
  url?: string
  thumbnailUrl?: string
}

export const imageApi = {
  /**
   * 获取所有图片
   */
  getAll: async (projectId?: number): Promise<ApiResponse<Image[]>> => {
    const params = projectId ? { projectId } : {}
    const response = await apiClient.get('/api/image', { params })
    return response.data
  },

  /**
   * 根据ID获取图片
   */
  getById: async (id: number): Promise<ApiResponse<Image>> => {
    const response = await apiClient.get(`/api/image/${id}`)
    return response.data
  },

  /**
   * 创建图片
   */
  create: async (data: CreateImageRequest): Promise<ApiResponse<Image>> => {
    const response = await apiClient.post('/api/image', data)
    return response.data
  },

  /**
   * 更新图片
   */
  update: async (id: number, data: UpdateImageRequest): Promise<ApiResponse<Image>> => {
    const response = await apiClient.put(`/api/image/${id}`, data)
    return response.data
  },

  /**
   * 删除图片
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/image/${id}`)
    return response.data
  },
}
