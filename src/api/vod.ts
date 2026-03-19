/**
 * Tencent Cloud VOD API Service
 * 腾讯云 VOD - 图片生成接口
 */

import { apiClient, ApiResponse } from './client'

export interface VodGenerateImageRequest {
  prompt: string
  aspectRatio: string
  imageSize: string
  imageURL?: string
  subAppId?: number
}

export interface VodGenerateImageResponse {
  imageUrl: string
  imageId: string
  width?: number
  height?: number
}

export const vodApi = {
  /**
   * 生成图片
   */
  generateImage: async (data: VodGenerateImageRequest): Promise<ApiResponse<VodGenerateImageResponse>> => {
    const response = await apiClient.post('/vod/generate-image', data)
    return response.data
  },
}
