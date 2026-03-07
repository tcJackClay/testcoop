/**
 * Approval API Service
 * 审批管理 - 审批的增删改查
 */

import { apiClient, ApiResponse } from './client'

// Approval types
export interface Approval {
  id: number
  type: string
  targetId: number
  targetType: string
  status: number // 0-待审批 1-已通过 2-已拒绝 3-已撤回
  comment?: string
  userId: number
  approverId?: number
  createTime?: string
  updateTime?: string
}

export interface CreateApprovalRequest {
  type: string
  targetId: number
  targetType: string
}

export interface ApprovalRequest {
  comment?: string
}

export const approvalApi = {
  /**
   * 获取所有审批
   */
  getAll: async (status?: number): Promise<ApiResponse<Approval[]>> => {
    const params = status !== undefined ? { status } : {}
    const response = await apiClient.get('/api/approval', { params })
    return response.data
  },

  /**
   * 根据ID获取审批
   */
  getById: async (id: number): Promise<ApiResponse<Approval>> => {
    const response = await apiClient.get(`/api/approval/${id}`)
    return response.data
  },

  /**
   * 审批通过
   */
  approve: async (id: number, data?: ApprovalRequest): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.put(`/api/approval/${id}/approve`, data)
    return response.data
  },

  /**
   * 审批拒绝
   */
  reject: async (id: number, data?: ApprovalRequest): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.put(`/api/approval/${id}/reject`, data)
    return response.data
  },

  /**
   * 撤回审批
   */
  revoke: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.put(`/api/approval/${id}/revoke`)
    return response.data
  },
}
