/**
 * Image API Service
 * 图片管理 - 图片的增删改查
 * 参考 huanu-workbench-frontend 实现
 */

import { apiClient, ApiResponse } from './client'

// Image types - 与 huanu-workbench-frontend 保持一致
export interface Image {
  id?: number
  resourceName: string
  resourceType: string
  resourceContent?: string
  resourceStatus?: string
  projectId: number
  userId?: number
  ext1?: string
  ext2?: string
  createdBy?: string
  updatedBy?: string
  createdTime?: string
  updatedTime?: string
  // 兼容字段
  name?: string
  url?: string
  thumbnailUrl?: string
  width?: number
  height?: number
  size?: number
  format?: string
  // 变体相关字段
  parentId?: string;  // 父资产名称（二级资产引用主要资产）
  variants?: string[]; // 主要资产的变体名称数组
}

export interface CreateImageRequest {
  resourceName: string
  resourceType?: string
  resourceContent?: string
  projectId: number
  userId?: number
  ext1?: string
  ext2?: string
}

export interface UpdateImageRequest {
  resourceName?: string
  resourceType?: string
  resourceContent?: string
  resourceStatus?: string
  ext1?: string
  ext2?: string
}

// 将后端响应转换为 Image 对象
const convertToImage = (data: any): Image => {
  return {
    id: data.id,
    resourceName: data.resourceName || data.name || '',
    resourceType: data.resourceType || 'image',
    resourceContent: data.resourceContent || data.url || data.resourceContent || '',
    resourceStatus: data.resourceStatus,
    projectId: data.projectId,
    userId: data.userId,
    ext1: data.ext1,
    ext2: data.ext2,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    createdTime: data.createdTime,
    updatedTime: data.updatedTime,
    // 兼容字段
    name: data.resourceName || data.name,
    url: data.resourceContent || data.url,
    thumbnailUrl: data.ext1,
    width: data.ext2 ? parseInt(data.ext2.split(',')[0]) : undefined,
    height: data.ext2 ? parseInt(data.ext2.split(',')[1]) : undefined,
  }
}

export const imageApi = {
  /**
   * 获取项目图片列表 - 使用 /image/list 接口
   */
  getAll: async (projectId?: number): Promise<Image[]> => {
    if (!projectId) {
      return []
    }
    
    const response = await apiClient.get<ApiResponse<Image[]>>(`/image/list`, {
      params: { projectId }
    })
    
    const res = response.data
    // 兼容两种响应格式：{ code: 0, data: [...] } 或 { data: [...] }
    if (res.code === 0 && res.data) {
      return res.data.map(convertToImage)
    }
    if (res.data) {
      return res.data.map(convertToImage)
    }
    console.warn('[imageApi.getAll] 返回数据为空:', res)
    return []
  },

  /**
   * 根据ID获取图片
   */
  getById: async (id: number): Promise<Image | null> => {
    const response = await apiClient.get<ApiResponse<Image>>(`/image/${id}`)
    
    const res = response.data
    if (res.code === 0 && res.data) {
      return convertToImage(res.data)
    }
    if (res.data) {
      return convertToImage(res.data)
    }
    return null
  },

  /**
   * 获取单个图片(包含base64数据)
   * 后端返回格式：{ data: { id, resourceName, resourceContent, ... } }
   */
  getImage: async (id: number): Promise<Image | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Image>>(`/image/${id}`)
      
      const res = response.data
      console.log('[imageApi.getImage] 原始响应:', res)
      
      // 处理两种响应格式：
      // 1. { code: 0, data: { id, resourceName, resourceContent, ... } }
      // 2. { data: { id, resourceName, resourceContent, ... } }
      if (res.code === 0 && res.data) {
        return convertToImage(res.data)
      }
      if (res.data) {
        // 检查是否是直接 base64 字符串
        if (typeof res.data === 'string') {
          return { id, resourceName: '', resourceType: 'image', resourceContent: res.data } as Image
        }
        return convertToImage(res.data)
      }
      return null
      return null
    } catch (error) {
      console.error('[imageApi.getImage] 获取图片失败:', error)
      return null
    }
  },
  /**
   * 创建图片
   */
  create: async (data: CreateImageRequest): Promise<Image | null> => {
    const payload = {
      resourceName: data.resourceName,
      resourceType: data.resourceType || 'image',
      resourceContent: data.resourceContent || '',
      projectId: data.projectId,
      userId: data.userId,
      ext1: data.ext1,
      ext2: data.ext2,
    }
    const response = await apiClient.post<ApiResponse<Image>>('/image', payload)
    
    const res = response.data
    if (res.code === 0 && res.data) {
      return convertToImage(res.data)
    }
    console.warn('[imageApi.create] 创建失败:', res)
    return null
  },

  /**
   * 更新图片
   */
  put: async (id: number, data: UpdateImageRequest): Promise<Image | null> => {
    // 构建完整请求体，包含 id 字段
    const payload = {
      id: id,
      resourceName: data.resourceName || '',
      resourceType: data.resourceType || 'image',
      resourceContent: data.resourceContent || '',
      resourceStatus: data.resourceStatus || '',
      ext1: data.ext1 || '',
      ext2: data.ext2 || '',
      status: 0,
    }
    const response = await apiClient.put<ApiResponse<Image>>(`/image/${id}`, payload)
    
    const res = response.data
    if (res.code === 0 && res.data) {
      return convertToImage(res.data)
    }
    return null
  },

  /**
   * 删除图片
   */
  delete: async (id: number): Promise<boolean> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/image/${id}`)
    
    const res = response.data
    return res.code === 0
  },
}
