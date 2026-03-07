/**
 * huanu-workbench-frontend API 对接参考文档
 * 
 * 本文档整理自 huanu-workbench-frontend 项目
 * 用于 aigc-coop-fronted 项目 API 迁移参考
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
 * ├── storyboardApi.ts  # 分镜台 API
 * ├── imageGenApi.ts    # 图片生成 API
 * ├── imageApi.ts       # 图片资源 API
 * ├── systemPromptApi.ts # 系统提示词 API
 * ├── vectorApi.ts      # 向量 API
 * └── llmApi.ts        # LLM API
 * 
 * ============================================
 * 2. 基础请求/响应格式
 * ============================================
 * 
 * 2.1 API 基础配置 (base.ts)
 * 
 * const API_BASE_URL = '/api';  // 可通过环境变量 VITE_API_BASE_URL 配置
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
 *   code?: number;
 *   msg?: string;
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
 * 3. 请求体格式 (Resource格式) - 重要！
 * ============================================
 * 
 * 创建请求体:
 * {
 *   "userId": 0,              // 必填
 *   "projectId": 0,           // 必填
 *   "resourceName": "string",  // 资源名称
 *   "resourceType": "string",  // 资源类型
 *   "resourceContent": "string", // 资源内容(JSON)
 *   "resourceStatus": "string", // 资源状态
 *   "status": 0,               // 数据状态(0=正常)
 *   "createdBy": "string",     // 创建人
 *   "updatedBy": "string",    // 更新人
 *   "ext1": "string",         // 扩展字段1
 *   "ext2": "string"          // 扩展字段2
 * }
 * 
 * 更新请求体:
 * {
 *   "id": 0,                  // 必填
 *   "userId": 0,              // 必填
 *   "projectId": 0,           // 必填
 *   // 其他字段可选
 * }
 * 
 * ============================================
 * 4. API 端点列表
 * ============================================
 * 
 * 4.1 认证 API (authApi.ts)
 * 
 * POST /api/auth/login         # 登录
 * POST /api/auth/register     # 注册
 * POST /api/auth/logout       # 登出
 * GET  /api/auth/me           # 获取当前用户
 * POST /api/auth/verify       # 验证token
 * 
 * 4.2 项目 API (projectApi.ts)
 * 
 * GET    /api/project/list    # 获取项目列表
 * GET    /api/project/{id}   # 获取单个项目
 * POST   /api/project        # 创建项目
 * PUT    /api/project/{id}   # 更新项目
 * DELETE /api/project/{id}   # 删除项目
 * 
 * 4.3 剧本 API (scriptApi.ts)
 * 
 * POST   /api/storyboard/analyze           # 分析剧本
 * GET    /api/storyboard/analysis/{id}    # 获取分析结果
 * POST   /api/storyboard/project/{id}/save # 保存分析结果
 * POST   /api/storyboard/upload           # 上传剧本文件
 * GET    /api/storyboard/projects         # 获取项目列表
 * GET    /api/storyboard/project/{id}    # 获取单个项目
 * 
 * 4.4 资产 API (assetApi.ts)
 * 
 * GET    /api/assets             # 获取资产列表
 * GET    /api/assets/{id}       # 获取单个资产
 * POST   /api/assets            # 创建资产
 * PUT    /api/assets/{id}      # 更新资产
 * DELETE /api/assets/{id}      # 删除资产
 * POST   /api/assets/import    # 批量导入资产
 * POST   /api/assets/from-canvas/{id} # 从画布保存到资产库
 * 
 * 4.5 分镜 API (shotApi.ts)
 * 
 * POST /api/shots/generate      # 生成分镜
 * POST /api/shots/batch-generate # 批量生成分镜
 * GET  /api/shots/{id}         # 获取分镜
 * PUT  /api/shots/{id}         # 更新分镜
 * 
 * 4.6 其他 API
 * 
 * POST /api/image/generate     # 生成图片
 * GET  /api/image/task/{taskId} # 获取任务状态
 * POST /api/vector/search     # 向量搜索
 * POST /api/vector/add        # 添加向量
 * 
 * ============================================
 * 5. 实体映射参考
 * ============================================
 * 
 * 项目 (Project):
 *   - resourceType: "project"
 *   - resourceName: 项目名称
 *   - resourceContent: 项目描述(JSON)
 *   - ext1: 封面图URL
 *   - ext2: 项目配置(JSON)
 * 
 * 剧本 (Script):
 *   - resourceType: "script"
 *   - resourceName: 剧本标题
 *   - resourceContent: 剧本内容(JSON)
 *   - projectId: 关联项目ID
 * 
 * 分镜 (Storyboard):
 *   - resourceType: "storyboard"
 *   - resourceName: 分镜名称
 *   - resourceContent: 分镜数据(JSON)
 *   - projectId: 关联项目ID
 *   - ext1: 缩略图URL
 * 
 * 资产 (Asset):
 *   - resourceType: "asset"
 *   - resourceName: 资产名称
 *   - resourceContent: 资产描述(JSON)
 *   - resourceStatus: "character" | "scene" | "prop"
 *   - projectId: 关联项目ID
 *   - ext1: 资产图片URL
 *   - ext2: 标签(JSON数组)
 * 
 * ============================================
 * 6. 代码示例
 * ============================================
 * 
 * // projectApi.ts 示例
 * const convertResourceToProject = (resource: any): Project => ({
 *   id: resource.id,
 *   name: resource.resourceName || '',
 *   description: resource.resourceContent || '',
 *   status: resource.status === 1 ? 'active' : resource.status === 2 ? 'completed' : 'archived',
 *   projectId: resource.projectId,
 *   createdAt: resource.createdTime || resource.createdAt,
 *   updatedAt: resource.updatedTime || resource.updatedAt,
 * });
 * 
 * const createProject = async (data) => {
 *   const payload = {
 *     resourceName: data.name,
 *     resourceType: 'project',
 *     resourceContent: data.description || '',
 *     resourceStatus: '1',
 *     projectId: data.projectId,
 *     ext1: data.cover,
 *     ext2: data.config,
 *   };
 *   const response = await fetchApi('/project', {
 *     method: 'POST',
 *     body: JSON.stringify(payload)
 *   });
 *   return convertResourceToProject(response);
 * };
 * 
 * // assetApi.ts 示例
 * const createAsset = async (data) => {
 *   return fetchApi('/assets', {
 *     method: 'POST',
 *     body: JSON.stringify(data)
 *   });
 * };
 * 
 * ============================================
 * 7. 状态值参考
 * ============================================
 * 
 * status (数据状态):
 *   0 = 正常
 *   1 = 禁用/删除
 *   2 = 待审核
 *   3 = 审核中
 * 
 * resourceStatus (资源状态):
 *   - 资产类型: "character" | "scene" | "prop"
 *   - 项目状态: "active" | "completed" | "archived"
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
 */
export interface ResourceRequest {
  id?: number;
  userId: number;
  projectId: number;
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
  projectId: number;
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
  description?: string;
  status: string;
  projectId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 资产
 */
export interface Asset {
  id: number;
  name: string;
  type: '角色' | '场景' | '道具';
  description: string;
  imageUrl: string;
  tags: string[];
  projectId?: number | string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * 通用 CRUD API 工厂函数
 */
export function createResourceApi<T>(resourcePath: string) {
  return {
    getList: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<T>>> => {
      const response = await apiClient.get(resourcePath, { params });
      return response.data;
    },
    getById: async (id: number | string): Promise<ApiResponse<T>> => {
      const response = await apiClient.get(`${resourcePath}/${id}`);
      return response.data;
    },
    create: async (data: Partial<T>): Promise<ApiResponse<T>> => {
      const response = await apiClient.post(resourcePath, data);
      return response.data;
    },
    update: async (id: number | string, data: Partial<T>): Promise<ApiResponse<T>> => {
      const response = await apiClient.put(`${resourcePath}/${id}`, data);
      return response.data;
    },
    delete: async (id: number | string): Promise<ApiResponse<void>> => {
      const response = await apiClient.delete(`${resourcePath}/${id}`);
      return response.data;
    },
  };
}
