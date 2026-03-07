/**
 * 项目请求体参考文档
 * 
 * 基于用户提供的请求体格式
 * 仅作为参考，不修改项目代码
 * 
 * ============================================
 * 请求体格式
 * ============================================
 * 
 * {
 *   "createdBy": "string",           // 创建人
 *   "updatedBy": "string",           // 更新人
 *   "createdTime": "ISO8601",        // 创建时间
 *   "updatedTime": "ISO8601",        // 更新时间
 *   "status": 0,                    // 状态 (0=正常)
 *   "id": 0,                        // 主键ID
 *   "resourceName": "string",       // 资源名称
 *   "resourceType": "string",       // 资源类型
 *   "resourceContent": "string",    // 资源内容
 *   "resourceStatus": "string",     // 资源状态
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
 * | userId | number | 是 | 所属用户ID (创建/更新时必填) |
 * | projectId | number | 是 | 关联项目ID (创建/更新时必填) |
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
 * 状态值参考
 * ============================================
 * 
 * status (数据状态):
 *   0 = 正常
 *   1 = 禁用/删除
 *   2 = 待审核
 *   3 = 审核中
 * 
 * ============================================
 * 本项目实体映射参考
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
 * 用户 (User):
 *   - resourceType: "user"
 *   - resourceName: 用户名
 *   - resourceContent: 用户信息(JSON)
 *   - ext1: 头像URL
 *   - ext2: 角色
 * 
 * ============================================
 */

import { apiClient, ApiResponse } from './client';

/**
 * 基础请求体接口
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
 * 创建请求体 (不含id, createdTime, updatedTime)
 * userId: 必填
 * projectId: 必填
 */
export interface CreateRequest {
  userId: number;
  projectId: number;
  resourceName: string;
  resourceType: string;
  resourceContent?: string;
  resourceStatus?: string;
  status: number;
  createdBy: string;
  updatedBy: string;
  ext1?: string;
  ext2?: string;
}

/**
 * 更新请求体 (含id，userId和projectId必填，其他可选)
 */
export interface UpdateRequest {
  id: number;
  userId: number;
  projectId: number;
  resourceName?: string;
  resourceType?: string;
  resourceContent?: string;
  resourceStatus?: string;
  status?: number;
  updatedBy: string;
  ext1?: string;
  ext2?: string;
}
 * 创建请求体 (不含id, createdTime, updatedTime)
 */
export interface CreateRequest extends Omit<BaseRequest, 'id' | 'createdTime' | 'updatedTime'> {}

/**
 * 更新请求体 (含id，其他可选)
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
 */
export function createApi<T extends BaseRequest>(basePath: string) {
  return {
    getList: async (params?: QueryParams): Promise<ApiResponse<PaginatedResponse<T>>> => {
      const response = await apiClient.get(basePath, { params });
      return response.data;
    },
    getById: async (id: number): Promise<ApiResponse<T>> => {
      const response = await apiClient.get(`${basePath}/${id}`);
      return response.data;
    },
    create: async (data: CreateRequest): Promise<ApiResponse<T>> => {
      const response = await apiClient.post(basePath, data);
      return response.data;
    },
    update: async (id: number, data: UpdateRequest): Promise<ApiResponse<T>> => {
      const response = await apiClient.put(`${basePath}/${id}`, data);
      return response.data;
    },
    delete: async (id: number): Promise<ApiResponse<void>> => {
      const response = await apiClient.delete(`${basePath}/${id}`);
      return response.data;
    },
  };
}
