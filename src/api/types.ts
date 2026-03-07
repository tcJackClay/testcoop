/**
 * API 请求体类型参考
 * 
 * 本文件导出通用的API类型定义，供其他API模块使用
 */

import { apiClient, ApiResponse } from './client';

// ============================================
// 审计字段类型
// ============================================

/**
 * 审计字段 - 所有实体都应包含这些字段
 * 用于追踪数据的创建和修改历史
 */
export interface AuditFields {
  /** 主键ID */
  id: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 创建人ID */
  createdBy?: number;
  /** 更新人ID */
  updatedBy?: number;
  /** 软删除时间 (null 表示未删除) */
  deletedAt?: string | null;
  /** 乐观锁版本号 */
  version?: number;
}

// ============================================
// 通用请求/响应类型
// ============================================

/**
 * 分页参数
 */
export interface PaginationParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 错误详情
 */
export interface ErrorDetail {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 详细错误信息 */
  details?: Record<string, unknown>;
}

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  success: false;
  error: ErrorDetail;
  timestamp: string;
}

// ============================================
// 通用 CRUD 操作类型
// ============================================

/**
 * 创建请求基础接口
 */
export interface CreateRequest {
  /** 创建人 (通常由后端自动填充) */
  createdBy?: number;
}

/**
 * 更新请求基础接口
 */
export interface UpdateRequest {
  /** 更新人 (通常由后端自动填充) */
  updatedBy?: number;
  /** 乐观锁版本号 */
  version?: number;
}

/**
 * 列表查询参数
 */
export interface ListQueryParams extends PaginationParams {
  /** 搜索关键词 */
  search?: string;
  /** 状态过滤 */
  status?: number;
  /** 创建人过滤 */
  createdBy?: number;
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
}

// ============================================
// 实体类型示例
// ============================================

/**
 * 项目实体
 */
export interface Project extends AuditFields {
  name: string;
  description?: string;
  cover?: string;
  status: number;
  userId: number;
}

/**
 * 创建项目请求
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
  cover?: string;
  status?: number;
}

/**
 * 更新项目请求
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  cover?: string;
  status?: number;
  version?: number;
}

/**
 * 用户实体
 */
export interface User extends AuditFields {
  username: string;
  email: string;
  role: string;
  status: number;
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: string;
  status?: number;
  version?: number;
}

/**
 * 剧本实体
 */
export interface Script extends AuditFields {
  title: string;
  content: string;
  status: number;
  projectId?: number;
  userId: number;
}

/**
 * 创建剧本请求
 */
export interface CreateScriptRequest {
  title: string;
  content: string;
  projectId?: number;
}

/**
 * 更新剧本请求
 */
export interface UpdateScriptRequest {
  title?: string;
  content?: string;
  status?: number;
  version?: number;
}

// ============================================
// CRUD API 工厂
// ============================================

/**
 * 通用 CRUD API 工厂函数
 * 
 * 使用示例:
 * ```typescript
 * const projectApi = createCrudApi<Project, CreateProjectRequest, UpdateProjectRequest>('/api/project');
 * 
 * // 获取所有
 * const projects = await projectApi.getAll({ page: 1, pageSize: 10 });
 * 
 * // 创建
 * const newProject = await projectApi.create({ name: '新项目' });
 * 
 * // 更新
 * const updated = await projectApi.update(1, { name: '更新名称' });
 * 
 * // 删除
 * await projectApi.delete(1);
 * ```
 */
export function createCrudApi<
  T extends AuditFields,
  CreateDTO extends CreateRequest,
  UpdateDTO extends UpdateRequest
>(resourcePath: string) {
  return {
    /**
     * 获取所有资源
     */
    getAll: async (params?: ListQueryParams): Promise<ApiResponse<T[]>> => {
      const response = await apiClient.get(resourcePath, { params });
      return response.data;
    },

    /**
     * 获取单个资源
     */
    getById: async (id: number): Promise<ApiResponse<T>> => {
      const response = await apiClient.get(`${resourcePath}/${id}`);
      return response.data;
    },

    /**
     * 创建资源
     */
    create: async (data: CreateDTO): Promise<ApiResponse<T>> => {
      const response = await apiClient.post(resourcePath, data);
      return response.data;
    },

    /**
     * 更新资源
     */
    update: async (id: number, data: UpdateDTO): Promise<ApiResponse<T>> => {
      const response = await apiClient.put(`${resourcePath}/${id}`, data);
      return response.data;
    },

    /**
     * 删除资源
     */
    delete: async (id: number): Promise<ApiResponse<void>> => {
      const response = await apiClient.delete(`${resourcePath}/${id}`);
      return response.data;
    },
  };
}
