/**
 * RunningHub API Service
 * 核心 API 服务
 */

import { runningHubConfig } from './config';
import {
  RunningHubFunction,
  RunningHubResult,
  TaskStatus,
  RHNodeField,
  RHCover,
} from './types';

// ============================================
// Cache Config
// ============================================

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时
const CACHE_STORAGE_KEY = 'aigc-coop-runninghub-nodeinfo-cache';

// ============================================
// API Service Class
// ============================================

class RunningHubApiService {
  private nodeInfoCache: Map<string, { data: RHNodeField[]; covers: RHCover[]; timestamp: number }> = new Map();

  constructor() {
    this.loadCacheFromStorage();
  }

  // ============================================
  // Cache Methods
  // ============================================

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, { data: RHNodeField[]; covers: RHCover[]; timestamp: number }>;
        for (const [key, value] of Object.entries(parsed)) {
          if (Date.now() - value.timestamp < CACHE_DURATION) {
            this.nodeInfoCache.set(key, value);
          }
        }
      }
    } catch (e) {
      console.warn('[RunningHub] 加载缓存失败:', e);
    }
  }

  private saveCacheToStorage(): void {
    try {
      const cacheObj: Record<string, { data: RHNodeField[]; covers: RHCover[]; timestamp: number }> = {};
      this.nodeInfoCache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
    } catch (e) {
      console.warn('[RunningHub] 保存缓存失败:', e);
    }
  }

  // ============================================
  // Auth Methods
  // ============================================

  private getHeaders(): HeadersInit {
    let authToken = runningHubConfig.getApiKey();
    
    // 优先从 localStorage 读取 token (与其他 API 一致)
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      authToken = storedToken;
    } else {
      // 备选：从 auth-storage 读取
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          if (parsed.state?.token) {
            authToken = parsed.state.token;
          }
        }
      } catch (e) {
        console.warn('[RunningHub] 读取认证 token 失败');
      }
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
  }

  // ============================================
  // API Methods
  // ============================================

  // 获取节点信息（带缓存）
  async getNodeInfo(webappId: string): Promise<{ nodeInfoList: RHNodeField[], coverList: RHCover[] }> {
    // 检查缓存
    const cached = this.nodeInfoCache.get(webappId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { nodeInfoList: cached.data, coverList: cached.covers || [] };
    }

    try {
      const baseUrl = runningHubConfig.getBaseUrl();
      const response = await fetch(`${baseUrl}/get-node-info?webAppId=${webappId}`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'accept': '*/*',
        },
        body: '',
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }

      const result: any = await response.json();

      let nodeInfoList: any[] = [];
      let covers: any[] = [];

      // 解析响应
      if (result.code === 0 && result.data?.nodeInfoList) {
        nodeInfoList = result.data.nodeInfoList;
        covers = result.data.covers || [];
      } else if (result.code === 0 && result.data?.data?.nodeInfoList) {
        nodeInfoList = result.data.data.nodeInfoList;
        covers = result.data.data.covers || [];
      } else if (result.nodeInfoList) {
        nodeInfoList = result.nodeInfoList;
        covers = result.covers || [];
      }

      if (nodeInfoList.length > 0) {
        this.nodeInfoCache.set(webappId, {
          data: nodeInfoList,
          covers: covers,
          timestamp: Date.now()
        });
        this.saveCacheToStorage();
        return { nodeInfoList, coverList: covers };
      }

      return { nodeInfoList: [], coverList: [] };
    } catch (error) {
      console.error('[RunningHub] 获取节点信息失败:', error);
      const cachedData = this.nodeInfoCache.get(webappId);
      if (cachedData) {
        return { nodeInfoList: cachedData.data, coverList: cachedData.covers || [] };
      }
      return { nodeInfoList: [], coverList: [] };
    }
  }

  // 提交任务 - 新版 API
  async submitTask(
    func: RunningHubFunction,
    inputs: Record<string, any>,
    nodeFields: RHNodeField[] = []
  ): Promise<{ success: boolean; taskId?: string; data?: any; error?: string }> {
    const baseUrl = runningHubConfig.getBaseUrl();

    const nodeInfoList = nodeFields.map(field => {
      const fieldValue = field.fieldValue || inputs[`${field.nodeId}-${field.fieldName}`] || inputs[field.fieldName] || '';
      return {
        nodeId: String(field.nodeId || ''),
        fieldName: String(field.fieldName || ''),
        fieldValue: String(fieldValue || ''),
        description: String(field.description || field.fieldName || ''),
      };
    });

    try {
      // 新版 API: POST /openapi/v2/run/ai-app/{webappId}
      const response = await fetch(`${baseUrl}/openapi/v2/run/ai-app/${func.webappId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          nodeInfoList,
          instanceType: 'default',
          usePersonalQueue: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 任务提交失败`);
      }

      const result = await response.json();
      console.log('[RunningHub] 提交任务响应:', result);
      
      if (result.taskId) {
        return {
          success: true,
          taskId: result.taskId,
        };
      }
      
      if (result.code !== 0) {
        throw new Error(result.message || result.errorMessage || '任务执行失败');
      }

      return {
        success: true,
        taskId: result.taskId,
      };
    } catch (error) {
      console.error('[RunningHub] submitTask 失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '任务执行失败',
      };
    }
  }

  // 递归提取图片 URL
  private extractImageUrl(obj: any): string {
    if (!obj) return '';
    
    // 常见图片字段名
    const imageFields = ['imageUrl', 'fileUrl', 'url', 'output', 'result', 'data'];
    
    for (const field of imageFields) {
      if (obj[field]) {
        const value = obj[field];
        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
          return value;
        }
        if (typeof value === 'object') {
          const nested = this.extractImageUrl(value);
          if (nested) return nested;
        }
      }
    }
    
    // 递归检查 data 字段
    if (obj.data) {
      if (typeof obj.data === 'string') return obj.data;
      return this.extractImageUrl(obj.data);
    }
    
    return '';
  }

  // 获取任务状态
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const baseUrl = runningHubConfig.getBaseUrl();

    try {
      // 新版 API: POST /openapi/v2/query
      const response = await fetch(`${baseUrl}/openapi/v2/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 获取任务状态失败`);
      }

      const data = await response.json();
      console.log('[RunningHub] 查询任务响应:', data);
      
      // 新版 API 返回格式
      const imageUrl = data.results?.[0]?.url || '';
      
      return {
        taskId,
        status: data.status?.toLowerCase() || 'processing',
        progress: data.status === 'SUCCESS' ? 100 : 50,
        result: imageUrl ? { images: [imageUrl] } : undefined,
        error: data.errorMessage,
      };
    } catch (error) {
      console.error('获取任务状态失败:', error);
      return {
        taskId,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : '获取状态失败',
      };
    }
  }

  // 上传文件
  async uploadFile(
    file: File,
    fileType: string = 'image'
  ): Promise<{ success: boolean; fileId?: string; url?: string; error?: string }> {
    const baseUrl = runningHubConfig.getBaseUrl();
    console.log('[RunningHub] 上传文件, baseUrl:', baseUrl, 'fileType:', fileType);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const authHeader = this.getHeaders();
      const response = await fetch(`${baseUrl}/openapi/v2/media/upload/binary`, {
        method: 'POST',
        headers: {
          'Authorization': (authHeader as Record<string, string>)['Authorization'] || '',
        },
        body: formData,
      });

      console.log('[RunningHub] 上传响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 文件上传失败`);
      }

      const data = await response.json();
      console.log('[RunningHub] 上传响应数据:', data);

      // 新版 API 返回格式
      const filePath = data.data?.download_url || data.data?.fileName || '';
      
      return {
        success: true,
        fileId: data.fileId || filePath,
        url: filePath,
      };
    } catch (error) {
      console.error('[RunningHub] uploadFile 失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  // 提交并轮询
  async submitAndPoll(
    func: RunningHubFunction,
    inputs: Record<string, any>,
    nodeFields: RHNodeField[] = [],
    onProgress?: (status: TaskStatus) => void
  ): Promise<RunningHubResult> {
    const taskResult = await this.submitTask(func, inputs, nodeFields);

    if (!taskResult.success) {
      return {
        success: false,
        error: taskResult.error || '任务执行失败',
      };
    }

    const fileUrl = taskResult.data?.fileUrl;
    
    if (fileUrl) {
      onProgress?.({
        taskId: taskResult.taskId || '',
        status: 'completed',
        progress: 100,
        result: {
          success: true,
          images: [fileUrl],
        },
      });

      return {
        success: true,
        images: [fileUrl],
      };
    }

    return {
      success: false,
      error: '未获取到生成结果',
    };
  }

  // ============================================
  // Direct API Methods - 前端直接调用 RunningHub
  // ============================================

  // 直接上传文件到 RunningHub（绕过代理）
  async uploadFileDirect(
    file: File
  ): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
    const baseUrl = runningHubConfig.getDirectBaseUrl();
    const apiKey = runningHubConfig.getApiKey();
    
    console.log('[RunningHub] 直接上传文件, baseUrl:', baseUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${baseUrl}/openapi/v2/media/upload/binary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      console.log('[RunningHub] 直接上传响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 文件上传失败`);
      }

      const data = await response.json();
      console.log('[RunningHub] 直接上传响应数据:', data);

      if (data.code === 0 && data.data) {
        return {
          success: true,
          url: data.data.download_url || '',  // 完整下载 URL
          fileName: data.data.fileName || '',  // 相对路径，用于任务提交
        };
      }

      return {
        success: false,
        error: data.message || '上传失败',
      };
    } catch (error) {
      console.error('[RunningHub] 直接上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  // 直接提交任务到 RunningHub
  async submitTaskDirect(
    webappId: string,
    nodeInfoList: { nodeId: string; fieldName: string; fieldValue: string; description?: string }[]
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    const baseUrl = runningHubConfig.getDirectBaseUrl();
    const apiKey = runningHubConfig.getApiKey();
    
    console.log('[RunningHub] 直接提交任务, webappId:', webappId);

    try {
      const response = await fetch(`${baseUrl}/openapi/v2/run/ai-app/${webappId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          nodeInfoList,
          instanceType: 'default',
          usePersonalQueue: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 任务提交失败`);
      }

      const result = await response.json();
      console.log('[RunningHub] 直接提交任务响应:', result);

      if (result.taskId) {
        return {
          success: true,
          taskId: result.taskId,
        };
      }

      return {
        success: false,
        error: result.message || result.errorMessage || '提交失败',
      };
    } catch (error) {
      console.error('[RunningHub] 直接提交任务失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '提交失败',
      };
    }
  }

  // 直接查询 RunningHub 任务状态
  async queryTaskDirect(
    taskId: string
  ): Promise<{ success: boolean; status?: string; imageUrl?: string; error?: string }> {
    const baseUrl = runningHubConfig.getDirectBaseUrl();
    const apiKey = runningHubConfig.getApiKey();
    
    console.log('[RunningHub] 直接查询任务, taskId:', taskId);

    try {
      const response = await fetch(`${baseUrl}/openapi/v2/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 查询失败`);
      }

      const data = await response.json();
      console.log('[RunningHub] 直接查询任务响应:', data);

      const status = data.status?.toLowerCase();
      const imageUrl = data.results?.[0]?.url;

      return {
        success: true,
        status,
        imageUrl,
      };
    } catch (error) {
      console.error('[RunningHub] 直接查询任务失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      };
    }
  }

  // 取消任务
  cancelTask(_taskId: string): void {
    // 目前后端同步等待，不需要取消
  }

  // 清除缓存
  clearCache(): void {
    this.nodeInfoCache.clear();
    localStorage.removeItem(CACHE_STORAGE_KEY);
  }

  // ============================================
  // 后端代理方法
  // ============================================

  // 通过后端上传文件到 RunningHub
  async uploadFileViaBackend(file: File): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', 'image');

      // 获取认证 token
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/runninghub/upload-file', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await response.json();
      console.log('[RunningHub] 上传响应:', data);
      
      if (data.code === 0 && data.data) {
        return {
          success: true,
          url: data.data.download_url || '',
          fileName: data.data.fileName || '',
        };
      }

      return {
        success: false,
        error: data.message || data.msg || '上传失败',
      };
    } catch (error) {
      console.error('[RunningHub] 后端代理上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  // 通过后端提交任务
  async submitTaskViaBackend(
    webappId: string,
    nodeInfoList: { nodeId: string; fieldName: string; fieldValue: string; description?: string }[]
  ): Promise<{ success: boolean; taskId?: string; fileUrl?: string; error?: string }> {
    try {
      // 获取认证 token
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/runninghub/save-nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          webappId,
          nodeInfoList,
        }),
      });

      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        return {
          success: true,
          taskId: data.data.taskId,
          fileUrl: data.data.fileUrl,
        };
      }

      return {
        success: false,
        error: data.message || '提交失败',
      };
    } catch (error) {
      console.error('[RunningHub] 后端代理提交任务失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '提交失败',
      };
    }
  }

  // 通过后端查询任务状态
  async queryTaskViaBackend(taskId: string): Promise<{ success: boolean; status?: string; fileUrl?: string; error?: string }> {
    try {
      // 获取认证 token
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/runninghub/query-task?taskId=${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        return {
          success: true,
          status: data.data.status,
          fileUrl: data.data.fileUrl,
        };
      }

      return {
        success: false,
        error: data.message || '查询失败',
      };
    } catch (error) {
      console.error('[RunningHub] 后端代理查询任务失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      };
    }
  }
}

// ============================================
// Export Singleton
// ============================================

export const runningHubApi = new RunningHubApiService();
