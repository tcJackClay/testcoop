/**
 * API 请求体参考文档
 * 
 * 本文件定义API请求/响应的标准格式
 * 所有API调用必须严格遵循此格式
 * 
 * ============================================
 * 请求体格式
 * ============================================
 * 
 * {
 *   "createdBy": "string",           // 创建人
 *   "updatedBy": "string",           // 更新人
 *   "createdTime": "2026-03-07T06:32:28.756Z",  // 创建时间
 *   "updatedTime": "2026-03-07T06:32:28.756Z",  // 更新时间
 *   "status": 0,                    // 状态 (0=正常)
 *   "id": 0,                        // 主键ID
 *   "resourceName": "string",       // 资源名称
 *   "resourceType": "string",       // 资源类型
 *   "resourceContent": "string",   // 资源内容
 *   "resourceStatus": "string",    // 资源状态
 *   "projectId": 0,                  // 关联项目ID
 *   "ext1": "string",                // 扩展字段1
 *   "ext2": "string",                // 扩展字段2
 *   "userId": 0                     // 用户ID
 * }
 * 
 * ============================================
 * 字段说明
 * ============================================
 * 
 * | 字段 | 类型 | 必填 | 说明 |
 * |------|------|------|------|
 * | id | number | 是 | 主键，后端生成 |
 * | userId | number | 是 | 所属用户ID |
 * | projectId | number | 否 | 关联项目ID |
 * | resourceName | string | 是 | 资源名称 |
 * | resourceType | string | 是 | 资源类型 |
 * | resourceContent | string | 否 | 资源内容(JSON字符串) |
 * | resourceStatus | string | 否 | 资源状态 |
 * | status | number | 是 | 数据状态(0=正常) |
 * | createdBy | string | 是 | 创建人(用户名) |
 * | updatedBy | string | 是 | 更新人(用户名) |
 * | createdTime | string | 是 | 创建时间(ISO8601) |
 * | updatedTime | string | 是 | 更新时间(ISO8601) |
 * | ext1 | string | 否 | 扩展字段1 |
 * | ext2 | string | 否 | 扩展字段2 |
 * 
 * ============================================
 * CRUD 操作
 * ============================================
 * 
 * 1. 创建 (POST /api/{resource})
 *    - 请求: 不需要 id, createdTime, updatedTime
 *    - 响应: 返回完整对象
 * 
 * 2. 更新 (PUT /api/{resource}/{id})
 *    - 请求: 需要 id，其他可选字段
 *    - 响应: 返回更新后的完整对象
 * 
 * 3. 删除 (DELETE /api/{resource}/{id})
 *    - 请求: 需要 id
 *    - 响应: 204 No Content
 * 
 * 4. 查询单个 (GET /api/{resource}/{id})
 *    - 请求: 需要 id
 *    - 响应: 返回完整对象
 * 
 * 5. 查询列表 (GET /api/{resource})
 *    - 请求: 分页参数 (page, pageSize)
 *    - 响应: { list: [], total, page, pageSize }
 * 
 * ============================================
 * 状态值参考
 * ============================================
 * 
 * status:
 *   0 = 正常
 *   1 = 禁用/删除
 *   2 = 待审核
 *   3 = 审核中
 * 
 * ============================================
 */

import { apiClient, ApiResponse } from './client';

/**
 * 基础请求体接口
 * 所有API请求体都继承此接口
 */
export interface BaseRequest {
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
 * 创建请求体
 * 创建时不包含 id, createdTime, updatedTime (后端生成)
 */
export interface CreateRequest extends Omit<BaseRequest, 'id' | 'createdTime' | 'updatedTime'> {}

/**
 * 更新请求体
 * 更新时需要 id，其他可选字段
 */
export interface UpdateRequest extends Partial<Omit<BaseRequest, 'id'>> {
  id: number;
}

/**
 * 查询参数
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  projectId?: number;
  resourceType?: string;
  status?: number;
  search?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 通用CRUD API
 * 
 * 使用示例:
 * const projectApi = createApi<BaseRequest>('/api/project');
 */
export function createApi<T extends BaseRequest>(basePath: string) {
  return {
    // 获取列表
    getList: async (params?: QueryParams): Promise<ApiResponse<PaginatedResponse<T>>> => {
      const response = await apiClient.get(basePath, { params });
      return response.data;
    },

    // 获取单个
    getById: async (id: number): Promise<ApiResponse<T>> => {
      const response = await apiClient.get(`${basePath}/${id}`);
      return response.data;
    },

    // 创建
    create: async (data: CreateRequest): Promise<ApiResponse<T>> => {
      const response = await apiClient.post(basePath, data);
      return response.data;
    },

    // 更新
    update: async (id: number, data: UpdateRequest): Promise<ApiResponse<T>> => {
      const response = await apiClient.put(`${basePath}/${id}`, data);
      return response.data;
    },

    // 删除
    delete: async (id: number): Promise<ApiResponse<void>> => {
      const response = await apiClient.delete(`${basePath}/${id}`);
      return response.data;
    },
  };
}
