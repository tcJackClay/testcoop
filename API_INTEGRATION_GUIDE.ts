/**
 * huanu-workbench-frontend API 对接文档
 * 
 * 本文档整理自 huanu-workbench-frontend 项目
 * 用于对接后端 API 的参考
 * 
 * ============================================
 * 目录
 * ============================================
 * 1. API 文件结构
 * 2. 基础请求/响应格式
 * 3. 请求体格式 (Resource格式)
 * 4. API 模块列表
 * 5. 类型定义
 * 
 * ============================================
 * 1. API 文件结构
 * ============================================
 * 
 * src/services/api/
 * ├── index.ts           # 统一导出
 * ├── base.ts            # 基础服务 (fetch封装、错误处理)
 * ├── authApi.ts         # 认证 API
 * ├── projectApi.ts     # 项目 API
 * ├── scriptApi.ts      # 剧本 API
 * ├── assetApi.ts       # 资产 API
 * ├── shotApi.ts        # 分镜 API
 * ├── imageGenApi.ts    # 图片生成 API
 * ├── imageApi.ts       # 图片资源 API
 * ├── systemPromptApi.ts # 系统提示词 API
 * ├── storyboardApi.ts  # 分镜 API
 * ├── vectorApi.ts      # 向量 API
 * └── llmApi.ts         # LLM API
 * 
 * ============================================
 * 2. 基础请求/响应格式
 * ============================================
 * 
 * 2.1 API 基础配置 (base.ts)
 * 
 * const API_BASE_URL = '/api';  // 可通过环境变量配置
 * 
 * // 请求头自动包含:
 * - Content-Type: application/json
 * - Authorization: Bearer {token}
 * 
 * 2.2 响应格式
 * 
 * // 成功响应
 * interface ApiResponse<T> {
 *   success: boolean;
 *   data?: T;
 *   error?: string;
 *   message?: string;
 * }
 * 
 * // 分页响应
 * interface PaginatedResponse<T> {
 *   items: T[];
 *   total: number;
 *   page: number;
 *   pageSize: number;
 *   hasMore: boolean;
 * }
 * 
 * 2.3 错误处理
 * 
 * class ApiError extends Error {
 *   constructor(
 *     message: string,
 *     public statusCode: number,
 *     public details?: unknown
 *   ) {}
 * }
 * 
 * // 401 错误会自动清除 token
 * if (response.status === 401) {
 *   localStorage.removeItem('auth-storage');
 * }
 * 
 * ============================================
 * 3. 请求体格式 (Resource格式)
 * ============================================
 * 
 * 后端使用统一的 Resource 格式:
 * 
 * {
 *   "id": 0,                    // 主键ID
 *   "userId": 0,                // 用户ID
 *   "projectId": 0,             // 项目ID
 *   "resourceName": "string",  // 资源名称
 *   "resourceType": "string",  // 资源类型 (如 "project", "script")
 *   "resourceContent": "string", // 资源内容 (JSON字符串)
 *   "resourceStatus": "string", // 资源状态
 *   "status": 0,                // 数据状态 (0=正常, 1=禁用)
 *   "createdBy": "string",      // 创建人
 *   "updatedBy": "string",     // 更新人
 *   "createdTime": "ISO8601",  // 创建时间
 *   "updatedTime": "ISO8601", // 更新时间
 *   "ext1": "string",          // 扩展字段1
 *   "ext2": "string"           // 扩展字段2
 * }
 * 
 * ============================================
 * 4. API 模块列表
 * ============================================
 * 
 * 4.1 认证 API (authApi.ts)
 * 
 * POST /api/auth/login
 * POST /api/auth/register
 * POST /api/auth/logout
 * GET  /api/auth/me
 * POST /api/auth/verify
 * 
 * 4.2 项目 API (projectApi.ts)
 * 
 * GET    /api/project/list
 * GET    /api/project/{id}
 * POST   /api/project
 * PUT    /api/project/{id}
 * DELETE /api/project/{id}
 * 
 * 4.3 剧本 API (scriptApi.ts)
 * 
 * POST   /api/storyboard/analyze         // 分析剧本
 * GET    /api/storyboard/analysis/{id}  // 获取分析结果
 * POST   /api/storyboard/project/{id}/save  // 保存分析结果
 * POST   /api/storyboard/upload         // 上传剧本文件
 * GET    /api/storyboard/projects      // 获取项目列表
 * GET    /api/storyboard/project/{id} // 获取单个项目
 * 
 * 4.4 资产 API (assetApi.ts)
 * 
 * GET    /api/assets                    // 获取资产列表
 * GET    /api/assets/{id}              // 获取单个资产
 * POST   /api/assets                   // 创建资产
 * PUT    /api/assets/{id}             // 更新资产
 * DELETE /api/assets/{id}             // 删除资产
 * POST   /api/assets/import           // 批量导入资产
 * POST   /api/assets/from-canvas/{id} // 从画布保存到资产库
 * 
 * 4.5 分镜 API (shotApi.ts)
 * 
 * POST /api/shots/generate           // 生成分镜
 * POST /api/shots/batch-generate    // 批量生成分镜
 * GET  /api/shots/{id}             // 获取分镜
 * PUT  /api/shots/{id}             // 更新分镜
 * 
 * 4.6 图片生成 API (imageGenApi.ts)
 * 
 * POST /api/image/generate           // 生成图片
 * GET  /api/image/task/{taskId}     // 获取任务状态
 * 
 * 4.7 向量 API (vectorApi.ts)
 * 
 * POST /api/vector/search            // 向量搜索
 * POST /api/vector/add              // 添加向量
 * 
 * ============================================
 * 5. 类型定义
 * ============================================
 * 
 * // 资产
 * interface Asset {
 *   id: number;
 *   name: string;
 *   type: '角色' | '场景' | '道具';
 *   description: string;
 *   imageUrl: string;
 *   tags: string[];
 *   projectId?: number | string;
 *   createdAt?: number;
 *   updatedAt?: number;
 * }
 * 
 * // 分镜
 * interface Shot {
 *   id: string;
 *   shotNumber: string;
 *   scale: '全景' | '中景' | '特写' | '近景';
 *   cameraWork: string;
 *   description: string;
 *   imageUrl?: string;
 *   selected: boolean;
 *   duration?: string;
 *   assetReferences?: string[];
 *   promptText?: string;
 *   generatedAt?: number;
 *   status?: 'pending' | 'processing' | 'completed' | 'failed';
 *   error?: string;
 * }
 * 
 * // 剧本场景
 * interface ScriptScene {
 *   id: string;
 *   title: string;
 *   type: '场景导入' | '动作细节' | '对白';
 *   content: string;
 *   character?: string;
 *   isAnalyzed?: boolean;
 *   sceneNumber?: number;
 *   location?: string;
 *   timeOfDay?: string;
 * }
 * 
 * // 项目
 * interface Project {
 *   id: string;
 *   name: string;
 *   scriptContent?: string;
 *   scriptAnalysisResult?: ScriptAnalysisResult;
 *   shotGroups: ShotGroup[];
 *   createdAt: string;
 *   updatedAt: string;
 * }
 * 
 * // 用户
 * interface User {
 *   id: string;
 *   name: string;
 *   role: UserRole;
 *   avatar?: string;
 * }
 * 
 * type UserRole = 'editor' | 'director' | 'viewer' | 'admin';
 * 
 * ============================================
 * 6. 使用示例
 * ============================================
 * 
 * // 基础 fetch 调用
 * const response = await fetchApi<ApiResponse<T>>('/api/project', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * });
 * 
 * // 项目 API 调用示例
 * const projectApi = {
 *   async getProjects() {
 *     const response = await fetchApi('/project/list');
 *     return response.data;
 *   },
 *   async createProject(data) {
 *     const payload = {
 *       resourceName: data.name,
 *       resourceType: 'project',
 *       resourceContent: data.description,
 *       resourceStatus: '1',
 *       projectId: data.projectId
 *     };
 *     return fetchApi('/project', {
 *       method: 'POST',
 *       body: JSON.stringify(payload)
 *     });
 *   }
 * };
 * 
 * ============================================
 */

import { apiClient, ApiResponse } from './client';

/**
 * 基础 API 响应类型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: number;
  msg?: string;
}

/**
 * 分页响应类型
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Resource 请求体格式
 * 后端统一使用此格式
 */
export interface ResourceRequest {
  id?: number;
  userId: number;
  projectId?: number;
  resourceName: string;
  resourceType: string;
  resourceContent?: string;
  resourceStatus?: string;
  status: number;
  createdBy: string;
  updatedBy: string;
  createdTime?: string;
  updatedTime?: string;
  ext1?: string;
  ext2?: string;
}

/**
 * 认证请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 认证响应
 */
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

/**
 * 项目请求
 */
export interface ProjectRequest {
  resourceName: string;
  resourceType?: string;
  resourceContent?: string;
  resourceStatus?: string;
  projectId?: number;
  ext1?: string;
  ext2?: string;
}

/**
 * 资产类型
 */
export type AssetType = '角色' | '场景' | '道具';

/**
 * 资产请求
 */
export interface AssetRequest {
  name: string;
  type: AssetType;
  description: string;
  imageUrl?: string;
  tags?: string[];
  projectId?: string;
}

/**
 * 资产过滤参数
 */
export interface AssetFilters {
  type?: AssetType | null;
  search?: string;
  tags?: string[];
  projectId?: string;
}

/**
 * 剧本分析请求
 */
export interface ScriptAnalysisRequest {
  scriptContent: string;
  projectName?: string;
  options?: {
    generateShots?: boolean;
    suggestStyle?: boolean;
    analyzeCinematography?: boolean;
    suggestArt?: boolean;
  };
}

/**
 * 剧本分析响应
 */
export interface ScriptAnalysisResponse {
  analysisId: string;
  projectId: string;
  scenes: ScriptScene[];
  shots: Shot[];
  overallStyle?: {
    primaryStyle?: string;
    colorPalette?: {
      primaryColors?: string[];
      secondaryColors?: string[];
      accentColors?: string[];
    };
    lighting?: {
      keyLight?: string;
      fillLight?: string;
      mood?: string;
    };
  };
  emotionCurve?: Array<{
    shotNumber: string;
    intensity: number;
    emotion: string;
  }>;
  tokenUsage?: Record<string, number>;
  processingTimeMs?: number;
}

/**
 * 剧本场景
 */
export interface ScriptScene {
  id: string;
  title: string;
  type: '场景导入' | '动作细节' | '对白';
  content: string;
  character?: string;
  isAnalyzed?: boolean;
  sceneNumber?: number;
  location?: string;
  timeOfDay?: string;
}

/**
 * 分镜
 */
export interface Shot {
  id: string;
  shotNumber: string;
  scale: '全景' | '中景' | '特写' | '近景';
  cameraWork: string;
  description: string;
  imageUrl?: string;
  selected: boolean;
  duration?: string;
  assetReferences?: string[];
  promptText?: string;
  generatedAt?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * 项目
 */
export interface Project {
  id: string;
  name: string;
  scriptContent?: string;
  shotGroups: ShotGroup[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 分镜组
 */
export interface ShotGroup {
  id: string;
  groupNumber: string;
  cameraWork: string;
  description: string;
  frames: Frame[];
  scriptSceneId?: string;
  assetReferences?: string[];
  order: number;
}

/**
 * 帧
 */
export interface Frame {
  id: string;
  frameNumber: string;
  scale: FrameScale;
  description: string;
  duration?: string;
  order: number;
  imageUrl?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * 镜头尺度
 */
export type FrameScale = 
  | '大远景' 
  | '远景' 
  | '全景' 
  | '中全景' 
  | '中景' 
  | '中近景' 
  | '近景' 
  | '特写' 
  | '大特写';

/**
 * 用户角色
 */
export type UserRole = 'editor' | 'director' | 'viewer' | 'admin';

/**
 * 用户
 */
export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

/**
 * 通用 CRUD API 工厂函数
 */
export function createResourceApi<T>(resourcePath: string) {
  return {
    // 获取列表
    getList: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<T>>>> => {
      const response = await apiClient.get(resourcePath, { params });
      return response.data;
    },

    // 获取单个
    getById: async (id: number | string): Promise<ApiResponse<T>> => {
      const response = await apiClient.get(`${resourcePath}/${id}`);
      return response.data;
    },

    // 创建
    create: async (data: Partial<T>): Promise<ApiResponse<T>> => {
      const response = await apiClient.post(resourcePath, data);
      return response.data;
    },

    // 更新
    update: async (id: number | string, data: Partial<T>): Promise<ApiResponse<T>> => {
      const response = await apiClient.put(`${resourcePath}/${id}`, data);
      return response.data;
    },

    // 删除
    delete: async (id: number | string): Promise<ApiResponse<void>> => {
      const response = await apiClient.delete(`${resourcePath}/${id}`);
      return response.data;
    },
  };
}
