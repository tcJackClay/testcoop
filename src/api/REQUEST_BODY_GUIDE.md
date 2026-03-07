/**
 * API 请求体参考文档
 * 
 * 本文件提供API请求体的标准格式和最佳实践
 * 包含审计字段、通用模式、错误处理等
 * 
 * ============================================
 * 目录
 * ============================================
 * 1. 审计字段 (Audit Fields)
 * 2. 通用请求/响应模式
 * 3. CRUD 操作标准格式
 * 4. 分页和过滤
 * 5. 错误处理
 * 6. 版本控制
 * 
 * ============================================
 * 1. 审计字段 (Audit Fields)
 * ============================================
 * 
 * 每个数据表都应包含以下审计字段，用于追踪数据的创建和修改历史：
 * 
 * | 字段 | 类型 | 说明 | 示例 |
 * |------|------|------|------|
 * | id | number | 主键唯一标识 | 1 |
 * | createdAt | string | 创建时间 (ISO 8601) | "2024-01-01T00:00:00Z" |
 * | updatedAt | string | 更新时间 (ISO 8601) | "2024-01-02T00:00:00Z" |
 * | createdBy | number | 创建人ID | 1 |
 * | updatedBy | number | 更新人ID | 2 |
 * | deletedAt | string? | 软删除时间 (可选) | "2024-01-03T00:00:00Z" |
 * | version | number | 乐观锁版本号 | 1 |
 * 
 * ============================================
 * 2. 通用请求/响应模式
 * ============================================
 * 
 * 2.1 基础响应包装
 * 
 * // 成功响应
 * interface ApiResponse<T> {
 *   success: true;
 *   data: T;
 *   message?: string;
 *   timestamp: string;
 * }
 * 
 * // 错误响应
 * interface ApiError {
 *   success: false;
 *   error: {
 *     code: string;      // 错误码，如 "VALIDATION_ERROR"
 *     message: string;   // 错误消息
 *     details?: Record<string, unknown>; // 详细错误信息
 *   };
 *   timestamp: string;
 * }
 * 
 * // 分页响应
 * interface PaginatedResponse<T> {
 *   success: true;
 *   data: T[];
 *   pagination: {
 *     page: number;       // 当前页码
 *     pageSize: number;  // 每页数量
 *     total: number;      // 总记录数
 *     totalPages: number; // 总页数
 *   };
 * }
 * 
 * ============================================
 * 3. CRUD 操作标准格式
 * ============================================
 * 
 * 3.1 创建资源 (POST)
 * 
 * 请求:
 * POST /api/v1/{resource}
 * Content-Type: application/json
 * 
 * {
 *   // 必需字段
 *   "name": "项目名称",
 *   
 *   // 可选字段
 *   "description": "项目描述",
 *   "cover": "https://...",
 *   
 *   // 审计字段 (通常由后端自动填充)
 *   "createdBy": 1
 * }
 * 
 * 响应 (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "项目名称",
 *     "description": "项目描述",
 *     "cover": "https://...",
 *     "status": 1,
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "updatedAt": "2024-01-01T00:00:00Z",
 *     "createdBy": 1,
 *     "updatedBy": 1
 *   }
 * }
 * 
 * --------------------------------------------
 * 3.2 更新资源 (PUT/PATCH)
 * 
 * 请求:
 * PUT /api/v1/{resource}/{id}
 * Content-Type: application/json
 * 
 * {
 *   // 部分字段更新 (使用 PATCH)
 *   "name": "新名称",
 *   "description": "新描述",
 *   
 *   // 审计字段 (通常由后端自动填充)
 *   "updatedBy": 2
 * }
 * 
 * 响应 (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "新名称",
 *     "description": "新描述",
 *     "updatedAt": "2024-01-02T00:00:00Z",
 *     "updatedBy": 2
 *   }
 * }
 * 
 * --------------------------------------------
 * 3.3 删除资源 (DELETE)
 * 
 * 请求:
 * DELETE /api/v1/{resource}/{id}
 * 
 * 响应 (204 No Content) 或:
 * {
 *   "success": true,
 *   "message": "删除成功"
 * }
 * 
 * --------------------------------------------
 * 3.4 获取单个资源 (GET)
 * 
 * 请求:
 * GET /api/v1/{resource}/{id}
 * 
 * 响应 (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "项目名称",
 *     ...
 *   }
 * }
 * 
 * --------------------------------------------
 * 3.5 获取资源列表 (GET)
 * 
 * 请求:
 * GET /api/v1/{resource}?page=1&pageSize=10&status=1&sortBy=createdAt&sortOrder=desc
 * 
 * 响应 (200 OK):
 * {
 *   "success": true,
 *   "data": [...],
 *   "pagination": {
 *     "page": 1,
 *     "pageSize": 10,
 *     "total": 100,
 *     "totalPages": 10
 *   }
 * }
 * 
 * ============================================
 * 4. 分页和过滤
 * ============================================
 * 
 * 4.1 分页参数
 * 
 * | 参数 | 类型 | 默认值 | 说明 |
 * |------|------|--------|------|
 * | page | number | 1 | 页码 |
 * | pageSize | number | 10 | 每页数量 |
 * | sortBy | string | createdAt | 排序字段 |
 * | sortOrder | asc/desc | desc | 排序方向 |
 * 
 * 4.2 过滤参数
 * 
 * | 参数 | 类型 | 说明 |
 * |------|------|------|
 * | status | number | 按状态过滤 |
 * | search | string | 关键词搜索 |
 * | createdBy | number | 按创建人过滤 |
 * | startDate | string | 开始日期 |
 * | endDate | string | 结束日期 |
 * 
 * ============================================
 * 5. 错误处理
 * ============================================
 * 
 * 5.1 HTTP 状态码
 * 
 * | 状态码 | 说明 | 使用场景 |
 * |--------|------|----------|
 * | 200 | OK | 成功获取/更新资源 |
 * | 201 | Created | 成功创建资源 |
 * | 204 | No Content | 成功删除资源 |
 * | 400 | Bad Request | 请求参数错误 |
 * | 401 | Unauthorized | 未认证 |
 * | 403 | Forbidden | 无权限 |
 * | 404 | Not Found | 资源不存在 |
 * | 409 | Conflict | 资源冲突 |
 * | 422 | Unprocessable Entity | 验证失败 |
 * | 500 | Internal Server Error | 服务器错误 |
 * 
 * 5.2 错误响应格式
 * 
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "验证失败",
 *     "details": {
 *       "name": "名称不能为空",
 *       "email": "邮箱格式不正确"
 *     }
 *   },
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * ============================================
 * 6. 版本控制
 * ============================================
 * 
 * 6.1 URL 版本控制
 * 
 * 推荐使用 URL 路径版本控制:
 * - /api/v1/{resource}
 * - /api/v2/{resource}
 * 
 * 6.2 响应版本字段
 * 
 * {
 *   "success": true,
 *   "data": {...},
 *   "version": "v1",
 *   "timestamp": "2024-01-01T00:00:00Z"
 * }
 * 
 * ============================================
 * 7. 实际应用示例
 * ============================================
 * 
 * 7.1 项目管理 (Project)
 * 
 * // 创建项目
 * interface CreateProjectRequest {
 *   name: string;           // 必需
 *   description?: string;
 *   cover?: string;
 *   status?: number;
 *   // 后端自动填充: createdBy, createdAt
 * }
 * 
 * // 更新项目
 * interface UpdateProjectRequest {
 *   name?: string;
 *   description?: string;
 *   cover?: string;
 *   status?: number;
 *   // 后端自动填充: updatedBy, updatedAt
 * }
 * 
 * // 项目实体
 * interface Project {
 *   id: number;
 *   name: string;
 *   description?: string;
 *   cover?: string;
 *   status: number;
 *   userId: number;         // 所属用户
 *   createdAt: string;
 *   updatedAt: string;
 *   createdBy?: number;
 *   updatedBy?: number;
 * }
 * 
 * --------------------------------------------
 * 7.2 用户管理 (User)
 * 
 * // 创建用户
 * interface CreateUserRequest {
 *   username: string;       // 必需
 *   email: string;          // 必需
 *   password: string;       // 必需
 *   role?: string;
 *   // 后端自动填充: createdBy, createdAt
 * }
 * 
 * // 更新用户
 * interface UpdateUserRequest {
 *   username?: string;
 *   email?: string;
 *   role?: string;
 *   status?: number;
 *   // 后端自动填充: updatedBy, updatedAt
 * }
 * 
 * --------------------------------------------
 * 7.3 剧本管理 (Script)
 * 
 * // 创建剧本
 * interface CreateScriptRequest {
 *   title: string;          // 必需
 *   content: string;        // 必需
 *   projectId?: number;     // 可选，关联项目
 *   // 后端自动填充: userId, createdBy, createdAt
 * }
 * 
 * // 更新剧本
 * interface UpdateScriptRequest {
 *   title?: string;
 *   content?: string;
 *   status?: number;
 *   // 后端自动填充: updatedBy, updatedAt
 * }
 * 
 * ============================================
 * 8. 最佳实践总结
 * ============================================
 * 
 * 1. 审计字段自动化
 *    - createdAt, updatedAt 由后端自动管理
 *    - createdBy, updatedBy 从认证上下文获取
 *    - 使用数据库触发器或 ORM 钩子自动填充
 * 
 * 2. 软删除优先
 *    - 使用 deletedAt 而非物理删除
 *    - 查询时默认过滤 deletedAt != null 的记录
 * 
 * 3. 乐观锁
 *    - 使用 version 字段防止并发更新冲突
 *    - 更新时检查 version 是否匹配
 * 
 * 4. 响应一致性
 *    - 始终返回统一的响应格式
 *    - 包含时间戳便于调试
 * 
 * 5. 验证
 *    - 前端进行基础验证
 *    - 后端进行完整验证
 *    - 返回详细的验证错误信息
 * 
 * 6. 安全
 *    - 敏感字段 (如 password) 不返回给前端
 *    - 使用 HTTPS
 *    - 实现适当的权限检查
 * 
 * ============================================
 * 9. 相关文件
 * ============================================
 * 
 * - api/client.ts - API 客户端配置
 * - api/project.ts - 项目管理 API 示例
 * - api/user.ts - 用户管理 API 示例
 * - api/script.ts - 剧本管理 API 示例
 */

import { apiClient, ApiResponse } from './client';

/**
 * 审计字段接口 - 所有实体都应包含这些字段
 */
export interface AuditFields {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  deletedAt?: string | null;
  version?: number;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
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
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * API 错误响应
 */
export interface ApiError {
  success: false;
  error: ErrorDetail;
  timestamp: string;
}

/**
 * 通用 CRUD API 工厂函数
 * 
 * 使用示例:
 * const projectApi = createCrudApi<Project, CreateProjectRequest, UpdateProjectRequest>('/api/project');
 */
export function createCrudApi<
  T extends AuditFields,
  CreateDTO,
  UpdateDTO
>(resourcePath: string) {
  return {
    /** 获取所有资源 */
    getAll: async (params?: PaginationParams & Record<string, unknown>): Promise<ApiResponse<T[]>> => {
      const response = await apiClient.get(resourcePath, { params });
      return response.data;
    },

    /** 获取单个资源 */
    getById: async (id: number): Promise<ApiResponse<T>> => {
      const response = await apiClient.get(`${resourcePath}/${id}`);
      return response.data;
    },

    /** 创建资源 */
    create: async (data: CreateDTO): Promise<ApiResponse<T>> => {
      const response = await apiClient.post(resourcePath, data);
      return response.data;
    },

    /** 更新资源 */
    update: async (id: number, data: UpdateDTO): Promise<ApiResponse<T>> => {
      const response = await apiClient.put(`${resourcePath}/${id}`, data);
      return response.data;
    },

    /** 删除资源 */
    delete: async (id: number): Promise<ApiResponse<void>> => {
      const response = await apiClient.delete(`${resourcePath}/${id}`);
      return response.data;
    },
  };
}
