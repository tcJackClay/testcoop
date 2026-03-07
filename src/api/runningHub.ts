/**
 * RunningHub API Service
 * RunningHub AI应用完整接入接口
 */

import { apiClient, ApiResponse } from './client'

// RunningHub types
export interface RHApp {
  id: string
  name: string
  description?: string
  icon?: string
}

export interface RHTaskRequest {
  appId: string
  inputs: Record<string, unknown>
  webhookUrl?: string
}

export interface RHTaskResponse {
  taskId: string
  status: string
}

export interface RHTaskResult {
  taskId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  output?: Record<string, unknown>
  error?: string
}

export const runningHubApi = {
  /**
   * 获取可用应用列表
   */
  getApps: async (): Promise<ApiResponse<RHApp[]>> => {
    const response = await apiClient.get('/api/runninghub/apps')
    return response.data
  },

  /**
   * 提交AI任务
   */
  submitTask: async (data: RHTaskRequest): Promise<ApiResponse<RHTaskResponse>> => {
    const response = await apiClient.post('/api/runninghub/tasks', data)
    return response.data
  },

  /**
   * 获取任务状态
   */
  getTaskStatus: async (taskId: string): Promise<ApiResponse<RHTaskResult>> => {
    const response = await apiClient.get(`/api/runninghub/tasks/${taskId}`)
    return response.data
  },

  /**
   * 取消任务
   */
  cancelTask: async (taskId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/runninghub/tasks/${taskId}`)
    return response.data
  },

  /**
   * 获取任务结果
   */
  getTaskResult: async (taskId: string): Promise<ApiResponse<RHTaskResult>> => {
    const response = await apiClient.get(`/api/runninghub/tasks/${taskId}/result`)
    return response.data
  },
}
