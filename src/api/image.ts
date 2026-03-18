/**
 * Image API Service
 * 图片管理 - 图片的增删改查
 * 参考 huanu-workbench-frontend 实现
 */

import { apiClient, ApiResponse } from './client'
import { useAuthStore } from '../stores/authStore'

// ========== 多人协同缓存机制 ==========
// 缓存配置：30秒过期
const CACHE_TTL = 30000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const assetCache: Map<number, CacheEntry<Image[]>> = new Map();

// 获取缓存
function getCachedAssets(projectId: number): Image[] | null {
  const entry = assetCache.get(projectId);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

// 设置缓存
function setCachedAssets(projectId: number, data: Image[]): void {
  assetCache.set(projectId, { data, timestamp: Date.now() });
}

// 清除指定项目缓存
function invalidateCache(projectId: number): void {
  assetCache.delete(projectId);
}

// 清除所有缓存
export function clearAssetCache(): void {
  assetCache.clear();
}


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



export const imageApi = {
  /**
   * 获取项目图片列表 - 使用 /image/list 接口
   */
  getAll: async (projectId?: number): Promise<Image[]> => {
    if (!projectId) {
      return []
    }
    
    // 优先使用缓存
    const cached = getCachedAssets(projectId);
    if (cached) {
      console.log('[imageApi.getAll] 使用缓存, projectId:', projectId);
      return cached;
    }
    
    const response = await apiClient.get<ApiResponse<Image[]>>(`/image/list`, {
      params: { projectId }
    })
    
    const res = response.data
    let images: Image[] = []
    
    // 兼容两种响应格式：{ code: 0, data: [...] } 或 { data: [...] }
    if (res.code === 0 && res.data) {
      images = res.data
    } else if (res.data) {
      images = res.data
    }
    
    // 存入缓存
    if (images.length > 0) {
      setCachedAssets(projectId, images);
    }
    
    console.log('[imageApi.getAll] 获取新数据, projectId:', projectId, 'count:', images.length);
    return images
  },

  /**
   * 根据ID获取图片
   * 直接调用 GET /api/image/{id} 获取单个资产元数据
   */
  getById: async (id: number): Promise<any> => {
    try {
      const response = await apiClient.get(`/image/${id}`);
      const res = response.data;
      
      // ===== 临时日志 =====
      console.log('[imageApi.getById] 原始返回:', res);
      // ====================
      
      // 直接返回元数据
      if (res && res.code === 0 && res.data) {
        return res.data;
      }
      if (res && res.id) {
        return res;
      }
      
      console.warn('[imageApi.getById] 未找到资产:', id);
      return null;
    } catch (err) {
      console.error('[imageApi.getById] 获取失败:', err);
      return null;
    }
  },

  /**
   * 获取可直接显示的图片 URL（统一入口）

   * @param id - 图片资产 ID
   * @returns 可直接用于 <img src=""> 的 URL
   */
  getDisplayUrl: async (id: number): Promise<string | null> => {
    try {
      // 获取资产信息
      const asset = await imageApi.getById(id);
      
      if (!asset || !asset.resourceContent) {
        console.warn('[imageApi.getDisplayUrl] 资产不存在或无内容');
        return null;
      }
      
      const content = asset.resourceContent;
      
      // 直接返回的情况
      if (
        content.startsWith('http://') || 
        content.startsWith('https://') ||
        content.startsWith('data:') ||
        content.startsWith('blob:')
      ) {
        return content;
      }
      
      // 其他情况，假设是 OSS 路径，拼接完整 URL
      // TODO: 如果有自定义域名，在这里配置
      return `https://huanu.oss-cn-hangzhou.aliyuncs.com/${content}`;
    } catch (err) {
      console.error('[imageApi.getDisplayUrl] 获取失败:', err);
      return null;
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
      status: 1,
    }
    const response = await apiClient.post<ApiResponse<Image>>('/image', payload)
    
    const res = response.data
    if (res.code === 0 && res.data) {
      // 创建成功后清除缓存，确保下次获取最新数据
      invalidateCache(data.projectId);
      return res.data
    }
    console.warn('[imageApi.create] 创建失败:', res)
    return null
  },

  /**
   * 根据项目ID和资源名称查询资产
   */
  getByName: async (projectId: number, resourceName: string): Promise<Image | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Image[]>>(`/image/list`, {
        params: { projectId }
      })
      
      const res = response.data
      let images: any[] = []
      
      if (res.code === 0 && res.data) {
        images = res.data
      } else if (res.data) {
        images = res.data
      }
      
      // 按名称查找匹配的资源
      const matched = images.find((img: any) => img.resourceName === resourceName)
      return matched || null
    } catch (error) {
      console.error('[imageApi.getByName] 查询失败:', error)
      return null
    }
  },

  /**
   * 更新图片
   */
  put: async (id: number, data: UpdateImageRequest): Promise<Image | null> => {
    // 构建完整请求体，包含 id 字段
    // 注意：不使用 || 默认值，让后端区分"未传"和"传空"
    const payload: Record<string, any> = {
      id: id,
    }
    // 只添加有值的字段
    if (data.resourceName !== undefined) payload.resourceName = data.resourceName;
    if (data.resourceType !== undefined) payload.resourceType = data.resourceType;
    if (data.resourceContent !== undefined) payload.resourceContent = data.resourceContent;
    if (data.resourceStatus !== undefined) payload.resourceStatus = data.resourceStatus;
    if (data.ext1 !== undefined) payload.ext1 = data.ext1;
    if (data.ext2 !== undefined) payload.ext2 = data.ext2;
    payload.status = 1;  // 状态 1 表示正常
    
    // 设置更新人和更新时间
    const currentUser = useAuthStore.getState().user;
    payload.updatedBy = currentUser?.username || 'unknown';
    payload.updatedTime = new Date().toISOString();
    
    const response = await apiClient.put<ApiResponse<Image>>(`/image/${id}`, payload)
    
    const res = response.data
    if (res.code === 0) {
      // 更新成功后清除缓存
      clearAssetCache();
      // 更新操作可能不返回 data，只要成功就返回
      return res.data ? res.data : { id, ...payload } as Image;
    }
    return null
  },

  /**
   * 删除图片
   */
  delete: async (id: number): Promise<boolean> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/image/${id}`)
    
    const res = response.data
    // 删除成功后清除缓存
    if (res.code === 0) {
      clearAssetCache();
    }
    return res.code === 0
  },
}
