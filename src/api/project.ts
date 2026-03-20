/**
 * Project API Service
 * 项目管理 - 项目的增删改查
 *_GUIDE  参考 REQUEST_BODY规范
 */

import { apiClient, ApiResponse } from './client'

// Project types - 符合 API 文档规范
export interface Project {
  id: number
  userId: number
  projectId?: number
  resourceName: string
  resourceType: string
  resourceContent?: string
  resourceStatus?: string
  status: number
  createdBy?: string
  updatedBy?: string
  createTime?: string
  updateTime?: string
  ext1?: string
  ext2?: string
}

// 兼容旧版 name/description 字段的视图模型
export interface ProjectView {
  id: number
  name: string
  description: string
  status: number
  statusText: string
  createTime?: string
  updateTime?: string
}

export interface CreateProjectRequest {
  resourceName: string
  resourceType?: string
  resourceContent?: string
  resourceStatus?: string
  projectId?: number
  ext1?: string
  ext2?: string
}

export interface UpdateProjectRequest {
  id: number
  resourceName?: string
  resourceType?: string
  resourceContent?: string
  resourceStatus?: string
  projectId?: number
  ext1?: string
  ext2?: string
}

// 将后端响应转换为视图模型
const convertToViewModel = (project: any): ProjectView => {
  let statusText = '未知';
  if (project.resourceStatus === '1' || project.resourceStatus === 'active') {
    statusText = '进行中';
  } else if (project.resourceStatus === '2' || project.resourceStatus === 'completed') {
    statusText = '已完成';
  } else if (project.resourceStatus === '0' || project.resourceStatus === 'archived') {
    statusText = '已归档';
  }
  
  return {
    id: project.id,
    name: project.resourceName || project.name || '',
    description: project.resourceContent || project.description || '',
    status: project.status,
    statusText,
    createTime: project.createTime,
    updateTime: project.updateTime,
  };
};

// 历史记录项类型
export interface HistoryRecord {
  name: string
  url: string
  createdAt: string
  type: 'image' | 'video'
  size?: number
}

export const projectApi = {
  /**
   * 获取所有项目
   */
  getAll: async (): Promise<ApiResponse<Project[]>> => {
    const response = await apiClient.get('/project/list')
    return response.data
  },

  /**
   * 根据ID获取项目
   */
  getById: async (id: number): Promise<ApiResponse<Project>> => {
    const response = await apiClient.get(`/project/${id}`)
    return response.data
  },

  /**
   * 获取项目历史记录（从 ext2 解析）
   */
  getHistory: async (projectId: number): Promise<HistoryRecord[]> => {
    const response = await apiClient.get(`/project/${projectId}`)
    const res = response.data
    
    if (res.code === 0 && res.data?.ext2) {
      try {
        const history = JSON.parse(res.data.ext2)
        return Array.isArray(history) ? history : []
      } catch (e) {
        console.error('[projectApi.getHistory] 解析 ext2 失败:', e)
        return []
      }
    }
    return []
  },

  /**
   * 添加历史记录到项目 ext2
   */
  addHistoryRecord: async (
    projectId: number, 
    record: Omit<HistoryRecord, 'createdAt'>
  ): Promise<boolean> => {
    try {
      // 先获取当前 ext2
      const response = await apiClient.get(`/project/${projectId}`)
      const res = response.data
      
      let history: HistoryRecord[] = []
      if (res.code === 0 && res.data?.ext2) {
        try {
          history = JSON.parse(res.data.ext2)
        } catch (e) {
          history = []
        }
      }
      
      // 添加新记录
      const newRecord: HistoryRecord = {
        ...record,
        createdAt: new Date().toISOString()
      }
      history.unshift(newRecord)
      
      // 限制最多 100 条
      if (history.length > 100) {
        history = history.slice(0, 100)
      }
      
      // 更新 ext2
      const updateResponse = await apiClient.put(`/project/${projectId}`, {
        ext2: JSON.stringify(history)
      })
      
      return updateResponse.data.code === 0
    } catch (e) {
      console.error('[projectApi.addHistoryRecord] 更新失败:', e)
      return false
    }
  },

  /**
   * 创建项目
   */
  create: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    const payload = {
      resourceName: data.resourceName,
      resourceType: data.resourceType || 'project',
      resourceContent: data.resourceContent || '',
      resourceStatus: data.resourceStatus || '1',
      projectId: data.projectId,
      ext1: data.ext1,
      ext2: data.ext2,
    }
    const response = await apiClient.post('/project', payload)
    return response.data
  },

  /**
   * 更新项目
   */
  update: async (id: number, data: UpdateProjectRequest): Promise<ApiResponse<Project>> => {
    const payload = {
      id,
      resourceName: data.resourceName,
      resourceType: data.resourceType || 'project',
      resourceContent: data.resourceContent,
      resourceStatus: data.resourceStatus,
      projectId: data.projectId,
      ext1: data.ext1,
      ext2: data.ext2,
    }
    const response = await apiClient.put(`/project/${id}`, payload)
    return response.data
  },

  /**
   * 删除项目
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/project/${id}`)
    return response.data
  },
}

// 导出视图模型的便捷方法
export const projectViewApi = {
  getAll: async (): Promise<ProjectView[]> => {
    const response = await projectApi.getAll()
    console.log('[projectViewApi.getAll] response:', response)
    if (response.code === 0 && response.data) {
      return response.data.map(convertToViewModel)
    }
    return []
  },
  
  create: async (name: string, description?: string): Promise<ProjectView | null> => {
    const response = await projectApi.create({
      resourceName: name,
      resourceContent: description || '',
      resourceStatus: '1',
    })
    if (response.code === 0 && response.data) {
      return convertToViewModel(response.data)
    }
    return null
  },
  
  update: async (id: number, name?: string, description?: string, status?: string): Promise<ProjectView | null> => {
    const response = await projectApi.update(id, {
      id,
      resourceName: name,
      resourceContent: description,
      resourceStatus: status,
    })
    if (response.code === 0 && response.data) {
      return convertToViewModel(response.data)
    }
    return null
  },
}
