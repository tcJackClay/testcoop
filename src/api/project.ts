import { apiClient, ApiResponse } from './client'

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

export interface ProjectView {
  id: number
  name: string
  description: string
  status: number
  statusText: string
  scriptCount?: number
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

export interface ProjectHistoryRecord {
  id: number
  projectId: number
  userId: number
  historyStatus: 'generated' | 'saved' | 'deleted' | 'missing' | 'failed'
  mediaType: 'image' | 'video'
  objectKey: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  contentHash?: string
  sourceTaskId?: string
  idempotencyKey?: string
  provider?: string
  model?: string
  workflowType?: string
  promptDigest?: string
  assetResourceId?: number
  createdBy?: string
  updatedBy?: string
  createdTime?: string
  updatedTime?: string
  status?: number
}

export interface RegisterProjectHistoryRequest {
  mediaType: 'image' | 'video'
  objectKey: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  contentHash?: string
  sourceTaskId?: string
  idempotencyKey?: string
  provider?: string
  model?: string
  workflowType?: string
  promptDigest?: string
}

const STATUS_TEXT_MAP: Record<string, string> = {
  '0': '已归档',
  '1': '进行中',
  '2': '已完成',
  active: '进行中',
  archived: '已归档',
  completed: '已完成',
  done: '已完成',
  history: '已归档',
  inactive: '已归档',
  official: '进行中',
  processing: '进行中',
  running: '进行中',
  success: '已完成',
}

const convertToViewModel = (project: Project): ProjectView => {
  const statusValue = String(project.resourceStatus ?? '').trim().toLowerCase()
  const statusText = STATUS_TEXT_MAP[statusValue] || '未知'

  return {
    id: project.id,
    name: project.resourceName || '',
    description: project.resourceContent || '',
    status: project.status,
    statusText,
    createTime: project.createTime,
    updateTime: project.updateTime,
  }
}

const extractObjectKey = (name?: string, url?: string): string => {
  if (name && !name.startsWith('http://') && !name.startsWith('https://')) {
    return name.replace(/^\/+/, '')
  }

  if (!url) {
    return ''
  }

  try {
    const parsed = new URL(url)
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  } catch {
    return url.replace(/^https?:\/\/[^/]+\//, '')
  }
}

const fileNameFromObjectKey = (objectKey: string): string =>
  objectKey.split('/').filter(Boolean).pop() || objectKey

export const projectApi = {
  getAll: async (): Promise<ApiResponse<Project[]>> => {
    const response = await apiClient.get('/project/list')
    return response.data
  },

  getById: async (id: number): Promise<ApiResponse<Project>> => {
    const response = await apiClient.get(`/project/${id}`)
    return response.data
  },

  getHistory: async (
    projectId: number,
    options?: {
      mediaType?: 'image' | 'video'
      historyStatus?: string
      page?: number
      pageSize?: number
    }
  ): Promise<ProjectHistoryRecord[]> => {
    const response = await apiClient.get<ApiResponse<ProjectHistoryRecord[]>>(
      `/project/${projectId}/history/list`,
      {
        params: {
          mediaType: options?.mediaType,
          historyStatus: options?.historyStatus,
          page: options?.page ?? 1,
          pageSize: options?.pageSize ?? 100,
        },
      }
    )

    const res = response.data
    if (res.code === 0 && Array.isArray(res.data)) {
      return res.data
    }
    return []
  },

  registerHistory: async (
    projectId: number,
    data: RegisterProjectHistoryRequest
  ): Promise<ProjectHistoryRecord | null> => {
    const response = await apiClient.post<ApiResponse<ProjectHistoryRecord>>(
      `/project/${projectId}/history/register`,
      data
    )

    const res = response.data
    if (res.code === 0 && res.data) {
      return res.data
    }
    return null
  },

  saveHistoryAsAsset: async (
    projectId: number,
    historyId: number
  ): Promise<boolean> => {
    const response = await apiClient.post(`/project/${projectId}/history/${historyId}/save-as-asset`)
    return response.data.code === 0
  },

  deleteHistory: async (
    projectId: number,
    historyId: number
  ): Promise<boolean> => {
    const response = await apiClient.delete(`/project/${projectId}/history/${historyId}`)
    return response.data.code === 0
  },

  addHistoryRecord: async (
    projectId: number,
    record: {
      name: string
      url: string
      type: 'image' | 'video'
      size?: number
    }
  ): Promise<boolean> => {
    const objectKey = extractObjectKey(record.name, record.url)
    if (!objectKey) {
      return false
    }

    const result = await projectApi.registerHistory(projectId, {
      mediaType: record.type,
      objectKey,
      fileName: fileNameFromObjectKey(objectKey),
      fileSize: record.size,
      idempotencyKey: `${record.type}:${objectKey}`,
    })

    return !!result
  },

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

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/project/${id}`)
    return response.data
  },
}

export const projectViewApi = {
  getAll: async (): Promise<ProjectView[]> => {
    const response = await projectApi.getAll()
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
