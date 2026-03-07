/**
 * Project API Service
 * 项目管理 - 项目的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Project types
export interface Project {
  id: number
  name: string
  description?: string
  cover?: string
  status: number
  userId: number
  createTime?: string
  updateTime?: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  cover?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  cover?: string
  status?: number
}

export const projectApi = {
  /**
   * 获取所有项目
   */
  getAll: async (): Promise<ApiResponse<Project[]>> => {
    const response = await apiClient.get('/api/project')
    return response.data
  },

  /**
   * 根据ID获取项目
   */
  getById: async (id: number): Promise<ApiResponse<Project>> => {
    const response = await apiClient.get(`/api/project/${id}`)
    return response.data
  },

  /**
   * 创建项目
   */
  create: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    const response = await apiClient.post('/api/project', data)
    return response.data
  },

  /**
   * 更新项目
   */
  update: async (id: number, data: UpdateProjectRequest): Promise<ApiResponse<Project>> => {
    const response = await apiClient.put(`/api/project/${id}`, data)
    return response.data
  },

  /**
   * 删除项目
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/project/${id}`)
    return response.data
  },
}
