/**
 * Prompt Generation Service
 * 提示词生成服务 - 根据设置选择不同引擎
 */

import { apiClient, ApiResponse } from './client'
import { vodApi, type VodGenerateImageResponse } from './vod'
import { uploadToOSS } from './oss'
import { imageApi, type Image } from './image'
import { projectApi } from './project'
import { useProjectStore } from '../stores/projectStore'
import { useAuthStore } from '../stores/authStore'

// 引擎类型
export type EngineType = 'vector' | 'tencent'

// 生成选项
export interface GenerateOptions {
  aspectRatio: string
  resolution: string
}

// 生成结果
export interface GenerateResult {
  imageUrl: string      // 图片 OSS URL
  imageId: number       // 资产 ID
  prompt: string        // 原始 prompt
}

// 获取当前引擎
export const getPromptEngine = (): EngineType => {
  const stored = localStorage.getItem('prompt-engine')
  if (stored === 'vector' || stored === 'tencent') {
    return stored
  }
  return 'vector' // 默认向量引擎
}

// 将 base64 或 blob 转为 File
function base64ToFile(base64: string, fileName: string): File {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], fileName, { type: mime })
}

// 下载图片为 Blob
async function downloadImage(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status}`)
  }
  return response.blob()
}

// 上传到 OSS 临时目录
async function uploadToTempOSS(url: string, projectId: number): Promise<string> {
  // 下载图片
  const blob = await downloadImage(url)
  const fileName = `temp_${Date.now()}.png`
  const file = new File([blob], fileName, { type: 'image/png' })
  
  // 生成临时路径 key
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  const ossKey = `temp/${projectId}/${timestamp}_${random}.png`
  
  // 使用 ali-oss 上传
  // @ts-ignore
  const OSS = (await import('ali-oss')).default
  
  // 获取 STS 凭证
  const stsResponse = await apiClient.get('/oss/sts-credentials')
  const credentials = stsResponse.data.data
  
  const client = new OSS({
    bucket: 'huanu',
    endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    stsToken: credentials.securityToken,
  })
  
  const result = await client.put(ossKey, file)
  return result.url
}

// 保存到资产库
async function saveToAssetLibrary(
  imageUrl: string,
  prompt: string,
  projectId: number
): Promise<Image | null> {
  const user = useAuthStore.getState().user
  
  const asset = await imageApi.create({
    resourceName: `生成_${Date.now()}`,
    resourceType: 'image',
    resourceContent: imageUrl,
    projectId,
    userId: user?.id,
    ext2: JSON.stringify([{
      type: '生成',
      prompt: prompt,
      timestamp: Date.now()
    }])
  })
  
  return asset
}

// 向量引擎生成图片
async function generateByVector(
  prompt: string,
  options: GenerateOptions,
  imageURL?: string
): Promise<VodGenerateImageResponse> {
  const requestBody: Record<string, unknown> = {
    prompt,
    aspectRatio: options.aspectRatio,
    width: parseResolution(options.resolution).width,
    height: parseResolution(options.resolution).height,
  }
  
  // 如果有输入图片，添加 imageURL
  if (imageURL) {
    requestBody.imageURL = imageURL
  }
  
  const response = await apiClient.post<ApiResponse<VodGenerateImageResponse>>(
    '/vector/generate-image',
    requestBody
  )
  
  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.msg || '向量引擎生成失败')
  }
  
  return response.data.data
}

// 腾讯云 VOD 生成图片
async function generateByTencent(
  prompt: string,
  options: GenerateOptions,
  imageURL?: string
): Promise<VodGenerateImageResponse> {
  // 直接用 fetch 发送请求
  const token = localStorage.getItem('auth_token')
  const requestBody: Record<string, unknown> = {
    prompt,
    aspectRatio: options.aspectRatio,
    imageSize: options.resolution,
    subAppId: 1254529958,
  }
  
  // 如果有输入图片，添加 imageURL
  if (imageURL) {
    requestBody.imageURL = imageURL
  }
  
  console.log('[PromptGen] ===== 腾讯云 VOD 请求 =====')
  console.log('[PromptGen] URL: /api/vod/generate-image')
  console.log('[PromptGen] Method: POST')
  console.log('[PromptGen] Headers:', { 'Content-Type': 'application/json', Authorization: token ? 'Bearer ***' : 'None' })
  console.log('[PromptGen] Body:', JSON.stringify(requestBody, null, 2))
  
  const response = await fetch('/api/vod/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(requestBody),
  })
  
  const result = await response.json()
  console.log('[PromptGen] ===== 腾讯云 VOD 响应 =====')
  console.log('[PromptGen] Status:', response.status, response.statusText)
  console.log('[PromptGen] Response:', JSON.stringify(result, null, 2))
  
  if (result.code !== 0 || !result.data) {
    console.error('[PromptGen] 腾讯云 VOD 生成失败, 完整响应:', result)
    throw new Error(`腾讯云 VOD 生成失败: ${JSON.stringify(result)}`)
  }
  
  // 兼容 imageUrl 和 url 两种返回格式
  return {
    imageUrl: result.data.imageUrl || result.data.url || result.data.base64,
    imageId: result.data.imageId || '',
    width: result.data.width,
    height: result.data.height,
  }
}

// 解析分辨率
function parseResolution(resolution: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    '1K': { width: 1024, height: 1024 },
    '2K': { width: 2048, height: 2048 },
    '4K': { width: 4096, height: 4096 },
  }
  return map[resolution] || map['1K']
}

// 主生成函数
export async function generateImage(
  prompt: string,
  options: GenerateOptions,
  imageURL?: string  // 可选的输入图片 URL
): Promise<GenerateResult> {
  const projectId = useProjectStore.getState().currentProjectId
  if (!projectId) {
    throw new Error('请先选择项目')
  }
  
  const engine = getPromptEngine()
  console.log('[PromptGen] 使用引擎:', engine)
  
  // 1. 调用对应引擎生成图片
  let imageUrl: string
  
  if (engine === 'tencent') {
    const result = await generateByTencent(prompt, options, imageURL)
    console.log('[PromptGen] 腾讯云返回结果:', result)
    imageUrl = result.imageUrl
    if (!imageUrl) {
      throw new Error('生成图片返回 URL 为空')
    }
  } else {
    const result = await generateByVector(prompt, options, imageURL)
    // 向量引擎可能返回 base64
    if (result.imageUrl.startsWith('data:')) {
      // 转为 File 上传
      const file = base64ToFile(result.imageUrl, 'generated.png')
      // 上传成功后异步记录到历史记录
      const uploadResult = await uploadToOSS(file, projectId, async (key, url) => {
        await projectApi.addHistoryRecord(projectId, {
          name: key,
          url: url,
          type: 'image'
        })
      })
      imageUrl = uploadResult
    } else {
      imageUrl = result.imageUrl
    }
  }
  
  console.log('[PromptGen] 原始图片 URL:', imageUrl)
  
  // 2. 上传到 OSS 临时目录（也记录到历史）
  const tempUrl = await uploadToTempOSS(imageUrl, projectId)
  console.log('[PromptGen] OSS 临时 URL:', tempUrl)
  
  // 记录到历史记录
  await projectApi.addHistoryRecord(projectId, {
    name: tempUrl.split('/').pop() || '',
    url: tempUrl,
    type: 'image'
  })
  
  // 3. 保存到资产库
  const asset = await saveToAssetLibrary(tempUrl, prompt, projectId)
  console.log('[PromptGen] 资产创建成功:', asset)
  
  if (!asset || !asset.id) {
    throw new Error('保存资产失败')
  }
  
  return {
    imageUrl: tempUrl,
    imageId: asset.id!,
    prompt,
  }
}

// 导出资产时更新 ext2（添加处理链）
export async function updateAssetProcessChain(
  assetId: number,
  processType: string,
  targetId?: number
): Promise<void> {
  const asset = await imageApi.getById(assetId)
  if (!asset) return
  
  let ext2: Array<{ type: string; targetId?: number; timestamp: number }> = []
  if (asset.ext2) {
    try {
      ext2 = JSON.parse(asset.ext2)
    } catch {
      ext2 = []
    }
  }
  
  ext2.push({
    type: processType,
    targetId,
    timestamp: Date.now()
  })
  
  await imageApi.put(assetId, {
    ext2: JSON.stringify(ext2)
  })
}
