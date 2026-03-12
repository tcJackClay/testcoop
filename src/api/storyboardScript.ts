/**
 * Storyboard Script API Service
 * 分镜脚本管理 - 分镜脚本的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Storyboard Script types
export interface StoryboardScript {
  id: number
  resourceName?: string
  resourceType?: string
  resourceContent?: string
  resourceStatus?: string
  name?: string
  content?: string
  scriptId?: number
  projectId?: number
  userId: number
  status: number
  createdBy?: string
  updatedBy?: string
  createdTime?: string
  updateTime?: string
  ext1?: string
  ext2?: string
}

export interface CreateStoryboardScriptRequest {
  resourceName: string
  resourceType?: string
  resourceContent?: string
  resourceStatus?: string
  scriptId?: number
  projectId?: number
  userId?: number
  status?: number
  createdBy?: string
  updatedBy?: string
  createdTime?: string
  updatedTime?: string
  ext1?: string
  ext2?: string
}

export interface UpdateStoryboardScriptRequest {
  resourceName?: string
  resourceType?: string
  resourceContent?: string
  resourceStatus?: string
  status?: number
  updatedBy?: string
  updatedTime?: string
  ext1?: string
  ext2?: string
}

export const storyboardScriptApi = {
  /**
   * 获取所有分镜脚本
   */
  getAll: async (scriptId?: number, projectId?: number): Promise<ApiResponse<StoryboardScript[]>> => {
    const params: Record<string, number> = {};
    if (scriptId) params.scriptId = scriptId;
    if (projectId !== undefined) params.projectId = projectId;
    
    const token = localStorage.getItem('auth_token');
    const response = await apiClient.get('/storyboard-script/list', { 
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },

  /**
   * 查询所有分镜脚本（不限 projectId）
   */
  getAllNoFilter: async (): Promise<ApiResponse<StoryboardScript[]>> => {
    const token = localStorage.getItem('auth_token');
    const response = await apiClient.get('/storyboard-script/list', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },

  /**
   * 根据ID获取分镜脚本
   */
  getById: async (id: number): Promise<ApiResponse<StoryboardScript>> => {
    const response = await apiClient.get(`/storyboard-script/${id}`)
    return response.data
  },

  /**
   * 创建分镜脚本
   */
  create: async (data: CreateStoryboardScriptRequest): Promise<ApiResponse<StoryboardScript>> => {
    const response = await apiClient.post('/storyboard-script', data)
    return response.data
  },

  /**
   * 更新分镜脚本
   */
  update: async (id: number, data: UpdateStoryboardScriptRequest): Promise<ApiResponse<StoryboardScript>> => {
    const response = await apiClient.put(`/storyboard-script/${id}`, data)
    return response.data
  },

  /**
   * 删除分镜脚本
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/storyboard-script/${id}`)
    return response.data
  },

  /**
   * 分镜脚本特殊操作
   */
  operate: async (id: number, data: Record<string, unknown>): Promise<ApiResponse<StoryboardScript>> => {
    const response = await apiClient.post(`/storyboard-script/${id}/operate`, data)
    return response.data
  },

  /**
   * 提交分镜脚本审批
   */
  commit: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/storyboard-script/${id}/commit`)
    return response.data
  },
}
