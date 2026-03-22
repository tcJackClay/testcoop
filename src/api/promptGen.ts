import { apiClient, ApiResponse } from './client'
import { uploadToOSS } from './oss'
import { imageApi, type Image } from './image'
import { projectApi } from './project'
import { useProjectStore } from '../stores/projectStore'
import { useAuthStore } from '../stores/authStore'

export type EngineType = 'vector' | 'tencent'

export interface GenerateOptions {
  aspectRatio: string
  resolution: string
}

export interface GenerateResult {
  imageUrl: string
  imageId: number
  prompt: string
}

interface VodGenerateImageResponse {
  imageUrl: string
  imageId?: string | number
  width?: number
  height?: number
}

export const getPromptEngine = (): EngineType => {
  const stored = localStorage.getItem('prompt-engine')
  if (stored === 'vector' || stored === 'tencent') {
    return stored
  }
  return 'vector'
}

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

async function downloadImage(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`download image failed: ${response.status}`)
  }
  return response.blob()
}

async function uploadToTempOSS(url: string, projectId: number): Promise<string> {
  const blob = await downloadImage(url)
  const file = new File([blob], `temp_${Date.now()}.png`, { type: 'image/png' })
  return uploadToOSS(file, projectId, undefined, `temp/${projectId}/`)
}

async function saveToAssetLibrary(
  imageUrl: string,
  prompt: string,
  projectId: number
): Promise<Image | null> {
  const user = useAuthStore.getState().user

  return imageApi.create({
    resourceName: `生成_${Date.now()}`,
    resourceType: 'image',
    resourceContent: imageUrl,
    projectId,
    userId: user?.id,
    ext2: JSON.stringify([
      {
        type: '生成',
        prompt,
        timestamp: Date.now(),
      },
    ]),
  })
}

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

  if (imageURL) {
    requestBody.imageURL = imageURL
  }

  const response = await apiClient.post<ApiResponse<VodGenerateImageResponse>>(
    '/vector/generate-image',
    requestBody
  )

  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.msg || 'vector generate failed')
  }

  return response.data.data
}

async function generateByTencent(
  prompt: string,
  options: GenerateOptions,
  imageURL?: string
): Promise<VodGenerateImageResponse> {
  const token = localStorage.getItem('auth_token')
  const requestBody: Record<string, unknown> = {
    prompt,
    aspectRatio: options.aspectRatio,
    imageSize: options.resolution,
    subAppId: 1254529958,
  }

  if (imageURL) {
    requestBody.imageURL = imageURL
  }

  const response = await fetch('/api/vod/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(requestBody),
  })

  const result = await response.json()
  if (result.code !== 0 || !result.data) {
    throw new Error(`tencent generate failed: ${JSON.stringify(result)}`)
  }

  return {
    imageUrl: result.data.imageUrl || result.data.url || result.data.base64,
    imageId: result.data.imageId || '',
    width: result.data.width,
    height: result.data.height,
  }
}

function parseResolution(resolution: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    '1K': { width: 1024, height: 1024 },
    '2K': { width: 2048, height: 2048 },
    '4K': { width: 4096, height: 4096 },
  }
  return map[resolution] || map['1K']
}

async function persistHistoryRecord(
  projectId: number,
  mediaType: 'image' | 'video',
  url: string,
  prompt: string
): Promise<Image | null> {
  await projectApi.addHistoryRecord(projectId, {
    name: url,
    url,
    type: mediaType,
  })

  return saveToAssetLibrary(url, prompt, projectId)
}

export async function generateImage(
  prompt: string,
  options: GenerateOptions,
  imageURL?: string
): Promise<GenerateResult> {
  const projectId = useProjectStore.getState().currentProjectId
  if (!projectId) {
    throw new Error('请先选择项目')
  }

  const engine = getPromptEngine()
  let tempUrl = ''

  if (engine === 'tencent') {
    const result = await generateByTencent(prompt, options, imageURL)
    if (!result.imageUrl) {
      throw new Error('generated image url is empty')
    }
    tempUrl = result.imageUrl.startsWith('data:')
      ? await uploadToOSS(
          base64ToFile(result.imageUrl, 'generated.png'),
          projectId,
          undefined,
          `temp/${projectId}/`
        )
      : await uploadToTempOSS(result.imageUrl, projectId)
  } else {
    const result = await generateByVector(prompt, options, imageURL)
    tempUrl = result.imageUrl.startsWith('data:')
      ? await uploadToOSS(
          base64ToFile(result.imageUrl, 'generated.png'),
          projectId,
          undefined,
          `temp/${projectId}/`
        )
      : await uploadToTempOSS(result.imageUrl, projectId)
  }

  const asset = await persistHistoryRecord(projectId, 'image', tempUrl, prompt)
  if (!asset || !asset.id) {
    throw new Error('save asset failed')
  }

  return {
    imageUrl: tempUrl,
    imageId: asset.id,
    prompt,
  }
}

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
    timestamp: Date.now(),
  })

  await imageApi.put(assetId, {
    ext2: JSON.stringify(ext2),
  })
}
