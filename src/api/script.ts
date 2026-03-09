/**
 * Script API Service
 * 剧本管理 - 剧本的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Script types
export interface Script {
  id: number
  title: string
  content: string
  status: number
  projectId?: number
  userId: number
  createTime?: string
  updateTime?: string
}

export interface CreateScriptRequest {
  title: string
  content: string
  projectId?: number
}

export interface UpdateScriptRequest {
  title?: string
  content?: string
  status?: number
}

export const scriptApi = {
  /**
   * 获取所有剧本
   */
  getAll: async (projectId?: number): Promise<ApiResponse<Script[]>> => {
    const params = projectId ? { projectId } : {}
    const response = await apiClient.get('/api/script', { params })
    return response.data
  },

  /**
   * 根据ID获取剧本
   */
  getById: async (id: number): Promise<ApiResponse<Script>> => {
    const response = await apiClient.get(`/api/script/${id}`)
    return response.data
  },

  /**
   * 创建剧本
   */
  create: async (data: CreateScriptRequest): Promise<ApiResponse<Script>> => {
    const response = await apiClient.post('/api/script', data)
    return response.data
  },

  /**
   * 更新剧本
   */
  update: async (id: number, data: UpdateScriptRequest): Promise<ApiResponse<Script>> => {
    const response = await apiClient.put(`/api/script/${id}`, data)
    return response.data
  },

  /**
   * 删除剧本
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/script/${id}`)
    return response.data
  },

  /**
   * 剧本特殊操作
   */
  operate: async (id: number, data: Record<string, unknown>): Promise<ApiResponse<Script>> => {
    const response = await apiClient.post(`/api/script/${id}/operate`, data)
    return response.data
  },

  /**
   * 提交剧本审批
   */
  commit: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/script/${id}/commit`)
    return response.data
  },

  /**
   * AI 分析剧本
   */
  analyze: async (data: {
    scriptContent: string
    projectId: number
    options?: {
      extractAssets?: boolean
      generateOutline?: boolean
      generateCharacterBios?: boolean
      analyzeRelationships?: boolean
    }
    styleConfig?: {
      visualStyle?: string
      aspectRatio?: string
    }
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/api/script/analyze', data)
    return response.data
  },
}
