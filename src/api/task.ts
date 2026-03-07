/**
 * Task API Service
 * 任务管理 - AI 生成任务的创建、轮询、结果获取
 */

import { apiClient, ApiResponse } from './client';

// Task types
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaskType = 'image' | 'video';

export interface TaskRequest {
  modelId: number;
  prompt: string;
  images?: string[];
  params: Record<string, unknown>;
}

export interface TaskResult {
  id: string;
  modelId: number;
  modelName: string;
  type: TaskType;
  status: TaskStatus;
  prompt: string;
  images?: string[];
  result?: string;
  error?: string;
  progress?: number;
  createTime: string;
  updateTime?: string;
}

export interface TaskListQuery {
  page?: number;
  size?: number;
  status?: TaskStatus;
  type?: TaskType;
}

export interface TaskListResponse {
  items: TaskResult[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const taskApi = {
  /**
   * 创建任务
   */
  create: async (data: TaskRequest): Promise<ApiResponse<TaskResult>> => {
    const response = await apiClient.post('/api/task', data);
    return response.data;
  },

  /**
   * 获取任务状态
   */
  getStatus: async (id: string): Promise<ApiResponse<TaskResult>> => {
    const response = await apiClient.get(`/api/task/${id}/status`);
    return response.data;
  },

  /**
   * 获取任务结果
   */
  getResult: async (id: string): Promise<ApiResponse<string>> => {
    const response = await apiClient.get(`/api/task/${id}/result`);
    return response.data;
  },

  /**
   * 取消任务
   */
  cancel: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/task/${id}/cancel`);
    return response.data;
  },

  /**
   * 删除任务
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/task/${id}`);
    return response.data;
  },

  /**
   * 获取任务列表
   */
  list: async (query?: TaskListQuery): Promise<ApiResponse<TaskListResponse>> => {
    const response = await apiClient.get('/api/task', { params: query });
    return response.data;
  },

  /**
   * 轮询任务状态（带重试）
   */
  poll: async (
    id: string,
    options?: {
      interval?: number;
      timeout?: number;
      onProgress?: (task: TaskResult) => void;
    }
  ): Promise<TaskResult> => {
    const { interval = 2000, timeout = 60000, onProgress } = options || {};
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await taskApi.getStatus(id);
          const task = response.data;
          
          if (onProgress) {
            onProgress(task);
          }

          if (task.status === 'completed') {
            resolve(task);
          } else if (task.status === 'failed') {
            reject(new Error(task.error || 'Task failed'));
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Task polling timeout'));
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  },
};
