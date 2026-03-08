/**
 * RunningHub API Service
 * 参考 huanu-workbench-frontend 实现
 * webAppID 相关参数已备份占位
 */

import { apiClient, ApiResponse } from './client';

// ============================================
// Types
// ============================================

export interface RunningHubConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  functions: RunningHubFunction[];
}

export interface RunningHubFunction {
  id: string;
  name: string;
  icon: string;
  color: string;
  webappId: string;  // TODO: 填写实际 webAppID
  category: string;
  description: string;
  inputFields?: RunningHubInputField[];
  parameters?: Record<string, any>;
}

export interface RunningHubInputField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'select' | 'number' | 'checkbox';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
  description?: string;
}

export interface RunningHubNodeData {
  label: string;
  type: 'runninghub';
  function?: RunningHubFunction;
  inputs: Record<string, any>;
  status: 'idle' | 'configuring' | 'pending' | 'processing' | 'completed' | 'failed';
  result?: RunningHubResult;
  error?: string;
  taskId?: string;
  progress?: number;
  nodeInfoList?: RHNodeField[];
  covers?: RHCover[];
  // 回调
  onDelete?: (id: string) => void;
  onEdit?: (id: string, data: Partial<RunningHubNodeData>) => void;
  onExecute?: (id: string) => void;
  onCancel?: (id: string) => void;
  onGenerateImage?: (url: string) => void;
}

export interface RunningHubResult {
  success: boolean;
  images?: string[];
  video?: string;
  files?: { name: string; url: string }[];
  metadata?: Record<string, any>;
  error?: string;
}

export interface TaskStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: RunningHubResult;
  estimatedTime?: number;
  error?: string;
}

export interface RHNodeField {
  nodeId: string;
  nodeName: string;
  description: string;
  descriptionEn?: string;
  fieldName: string;
  fieldType: 'STRING' | 'TEXT' | 'LIST' | 'IMAGE' | 'AUDIO' | 'VIDEO';
  fieldValue?: any;
  fieldData?: string;  // LIST 类型的选项 JSON
}

export interface RHCover {
  coverId: string;
  coverUrl: string;
  thumbnailUri?: string;
  name?: string;
}

// ============================================
// Default Functions - webAppID 备用
// ============================================

export const DEFAULT_FUNCTIONS: RunningHubFunction[] = [
  {
    id: 'ai_image_upscale',
    name: '图片放大',
    icon: '⬆️',
    color: '#3B82F6',
    webappId: '2007596875607707650', // 图片放大
    category: '图片处理',
    description: '限制：4080最长边',
  },
  {
    id: 'image_enhance',
    name: '人物多角度',
    icon: '🖼️',
    color: '#10B981',
    webappId: '1997953926043459586', // 人物多角度
    category: '图片处理',
    description: '1：上传主角图片；2：提示词输入；3：点击运行',
  },
  {
    id: 'style_transfer',
    name: '图片融合',
    icon: '🎭',
    color: '#8B5CF6',
    webappId: '1954402676572340225', // 图片融合
    category: '图片处理',
    description: '拼好的图片融入到场景中',
  },
  {
    id: 'video_editing',
    name: '镜头分镜',
    icon: '🎬',
    color: '#EC4899',
    webappId: '2004018172321800193', // 镜头分镜
    category: '图片处理',
    description: '上传图片即可出分镜',
  },
  {
    id: 'text_analysis',
    name: '道具迁移',
    icon: '📝',
    color: '#6B7280',
    webappId: '1973744628144975874', // 道具迁移
    category: '图片处理',
    description: '图片1目标图，图片2放入的道具',
  },
  {
    id: 'data_visualization',
    name: '动作迁移',
    icon: '📊',
    color: '#059669',
    webappId: '1996522834732130305', // 动作迁移
    category: '视频处理',
    description: '图片与视频比例一致，5-60s',
  },
  {
    id: 'video_upscale',
    name: '视频高清',
    icon: '📈',
    color: '#059669',
    webappId: '1933689617772404738', // 视频高清
    category: '视频处理',
    description: '视频高清放大+补帧',
  },
];

// ============================================
// Config Service
// ============================================

const STORAGE_KEY = 'aigc-coop-runninghub-config';

class RunningHubConfigService {
  private config: RunningHubConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): RunningHubConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...{
            enabled: false,
            apiKey: '',
            baseUrl: '/api/runninghub',
            functions: DEFAULT_FUNCTIONS,
          },
          ...parsed,
          functions: parsed.functions || DEFAULT_FUNCTIONS,
        };
      }
    } catch (e) {
      console.warn('加载 RunningHub 配置失败:', e);
    }
    return {
      enabled: false,
      apiKey: '',
      baseUrl: '/api/runninghub',
      functions: DEFAULT_FUNCTIONS,
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('保存 RunningHub 配置失败:', e);
    }
  }

  getConfig(): RunningHubConfig {
    return this.config;
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  getApiKey(): string {
    return this.config.apiKey;
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.saveConfig();
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  getFunctions(): RunningHubFunction[] {
    return this.config.functions;
  }

  getFunctionById(id: string): RunningHubFunction | undefined {
    return this.config.functions.find(f => f.id === id);
  }

  getCategories(): string[] {
    const categories = new Set(this.config.functions.map(f => f.category));
    return Array.from(categories);
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }
}

export const runningHubConfig = new RunningHubConfigService();

// ============================================
// API Service
// ============================================

// 24小时缓存
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const CACHE_STORAGE_KEY = 'aigc-coop-runninghub-nodeinfo-cache';

class RunningHubApiService {
  private nodeInfoCache: Map<string, { data: RHNodeField[]; covers: RHCover[]; timestamp: number }> = new Map();

  constructor() {
    this.loadCacheFromStorage();
  }

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

  private getHeaders(): HeadersInit {
    let authToken = runningHubConfig.getApiKey();
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
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
  }

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

  // 提交任务
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
      const response = await fetch(`${baseUrl}/save-nodes`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          webappId: String(func.webappId || ''),
          nodeInfoList,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 任务提交失败`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.message || '任务执行失败');
      }

      // 提取图片 URL
      const imageUrl = this.extractImageUrl(result);

      return {
        success: true,
        taskId: result.data?.taskId,
        data: { fileUrl: imageUrl },
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
      const response = await fetch(`${baseUrl}/task/${taskId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 获取任务状态失败`);
      }

      const data = await response.json();
      return {
        taskId,
        status: data.status || 'processing',
        progress: data.progress || 0,
        result: data.result,
        estimatedTime: data.estimatedTime,
        error: data.error,
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
    _function: RunningHubFunction,
    fileType: 'image' | 'audio' | 'video' | 'input' = 'image'
  ): Promise<{ success: boolean; fileId?: string; url?: string; error?: string }> {
    const baseUrl = runningHubConfig.getBaseUrl();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await fetch(`${baseUrl}/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': this.getHeaders()['Authorization'] || '',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 文件上传失败`);
      }

      const data = await response.json();
      const filePath = data.data?.data?.fileName || data.thirdPartyResponse?.filePath || data.thirdPartyResponse?.url || data.url || '';
      
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

  // 取消任务
  cancelTask(_taskId: string): void {
    // 目前后端同步等待，不需要取消
  }

  // 清除缓存
  clearCache(): void {
    this.nodeInfoCache.clear();
    localStorage.removeItem(CACHE_STORAGE_KEY);
  }
}

export const runningHubApi = new RunningHubApiService();

// ============================================
// Legacy API (保持向后兼容)
// ============================================

export interface RHApp {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface RHTaskRequest {
  appId: string;
  inputs: Record<string, unknown>;
  webhookUrl?: string;
}

export interface RHTaskResponse {
  taskId: string;
  status: string;
}

export interface RHTaskResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: Record<string, unknown>;
  error?: string;
}

export const legacyRunningHubApi = {
  getApps: async (): Promise<ApiResponse<RHApp[]>> => {
    const response = await apiClient.get('/api/runninghub/apps')
    return response.data
  },

  submitTask: async (data: RHTaskRequest): Promise<ApiResponse<RHTaskResponse>> => {
    const response = await apiClient.post('/api/runninghub/tasks', data)
    return response.data
  },

  getTaskStatus: async (taskId: string): Promise<ApiResponse<RHTaskResult>> => {
    const response = await apiClient.get(`/api/runninghub/tasks/${taskId}`)
    return response.data
  },

  cancelTask: async (taskId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/runninghub/tasks/${taskId}`)
    return response.data
  },

  getTaskResult: async (taskId: string): Promise<ApiResponse<RHTaskResult>> => {
    const response = await apiClient.get(`/api/runninghub/tasks/${taskId}/result`)
    return response.data
  },
};
