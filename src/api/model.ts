/**
 * Model API Service
 * 模型管理 - 模型配置的增删改查
 */

import { apiClient, ApiResponse } from './client';

// Model types
export interface ModelConfig {
  id: number;
  name: string;
  provider: string;
  modelId: string;
  baseUrl: string;
  apiKey: string;
  type: 'image' | 'video';
  status: number;
  config: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
}

export interface CreateModelRequest {
  name: string;
  provider: string;
  modelId: string;
  baseUrl: string;
  apiKey: string;
  type: 'image' | 'video';
  config?: Record<string, unknown>;
}

export interface UpdateModelRequest {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  status?: number;
  config?: Record<string, unknown>;
}

// Re-use the existing apiClient from client.ts
export const modelApi = {
  /**
   * 获取所有模型配置
   */
  getAll: async (type?: string): Promise<ApiResponse<ModelConfig[]>> => {
    const params = type ? { type } : {};
    const response = await apiClient.get('/api/model', { params });
    return response.data;
  },

  /**
   * 根据ID获取模型配置
   */
  getById: async (id: number): Promise<ApiResponse<ModelConfig>> => {
    const response = await apiClient.get(`/api/model/${id}`);
    return response.data;
  },

  /**
   * 创建模型配置
   */
  create: async (data: CreateModelRequest): Promise<ApiResponse<ModelConfig>> => {
    const response = await apiClient.post('/api/model', data);
    return response.data;
  },

  /**
   * 更新模型配置
   */
  update: async (id: number, data: UpdateModelRequest): Promise<ApiResponse<ModelConfig>> => {
    const response = await apiClient.put(`/api/model/${id}`, data);
    return response.data;
  },

  /**
   * 删除模型配置
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/model/${id}`);
    return response.data;
  },

  /**
   * 测试模型配置
   */
  test: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.post(`/api/model/${id}/test`);
    return response.data;
  },

  /**
   * 启用/禁用模型
   */
  toggleStatus: async (id: number, enabled: boolean): Promise<ApiResponse<ModelConfig>> => {
    const response = await apiClient.put(`/api/model/${id}/status`, { status: enabled ? 1 : 0 });
    return response.data;
  },
};
