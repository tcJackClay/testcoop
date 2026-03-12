/**
 * Vector Engine API Service
 * 向量引擎API - 图片生成、视频创建和文生文接口
 */

import { apiClient, ApiResponse } from './client'

// Vector Engine types
export interface ImageUploadRequest {
  imageUrl: string
}

export interface ImageUploadResponse {
  imageId: string
  imageUrl: string
}

export interface ImageGenRequest {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  seed?: number
}

export interface ImageResponse {
  imageUrl: string
  imageId: string
  base64?: string
  localPath?: string
  width: number
  height: number
}

export interface VideoRequest {
  prompt: string
  duration?: number
  aspectRatio?: string
}

export interface SoraVideoResponse {
  videoUrl: string
  videoId: string
  status: string
}

export interface VectorChatCompletionRequest {
  messages?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  prompt?: string
  type: 1 | 2 | 3 | 4 | 5 // 1-资产提取 2-剧本分析-产出故事大纲 3-转分镜 4-转图提示词 5-转视频提示词
  model?: string
}

export const vectorApi = {
  /**
   * 图片上传图床
   */
  uploadImage: async (data: ImageUploadRequest): Promise<ApiResponse<string>> => {
    const response = await apiClient.post('/vector/upload-image', data)
    return response.data
  },

  /**
   * 用户图片文件上传图床
   */
  uploadImageFile: async (file: File): Promise<ApiResponse<ImageResponse>> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/vector/upload-image-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  /**
   * 生成图片
   */
  generateImage: async (data: ImageGenRequest): Promise<ApiResponse<ImageResponse>> => {
    const response = await apiClient.post('/vector/generate-image', data)
    return response.data
  },

  /**
   * 创建视频 (sora-2模型)
   */
  createVideo: async (data: VideoRequest): Promise<ApiResponse<SoraVideoResponse>> => {
    const response = await apiClient.post('/vector/create-video', data)
    return response.data
  },

  /**
   * 文生文聊天
   */
  chatCompletion: async (data: VectorChatCompletionRequest, timeout: number = 120000): Promise<ApiResponse<string>> => {
    const response = await apiClient.post('/vector/chat-completion', data, { timeout })
    return response.data
  },

  /**
   * 文生文聊天 - 文件上传
   */
  chatCompletionFile: async (file: File, type: number, timeout: number = 120000): Promise<ApiResponse<string>> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post(`/vector/chat-completion-file?type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: timeout, // 增加超时时间到 120 秒
    } as any)
    return response.data
  },
}
