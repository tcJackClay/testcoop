/**
 * OSS 上传工具
 * 阿里云 OSS + STS 临时凭证
 */

import { apiClient } from './client';

// OSS 配置
const OSS_CONFIG = {
  bucket: 'huanu',
  region: 'cn-hangzhou',
  endpoint: 'oss-cn-hangzhou.aliyuncs.com',
};

// ========== 模拟后端 STS 凭证（开发环境使用）==========
const MOCK_STS = true; // 设为 false 后使用真实后端

const mockCredentials: STSCredentials = {
  accessKeyId: 'STS.LTAI5tSAJb2orcXD3i5vLKsG',
  accessKeySecret: 'mock-secret-xxx',
  securityToken: 'mock-token-xxx',
  expiration: new Date(Date.now() + 3600000).toISOString(),
};
// ======================================================

/**
 * STS 临时凭证
 */
interface STSCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
}

/**
 * OSS 上传签名信息
 */
interface OSSSignature {
  credentials: STSCredentials;
  bucket: string;
  endpoint: string;
  key: string;
  host: string;
}

/**
 * 从后端获取 STS 临时凭证和上传签名
 * 
 * 后端需要实现：
 * 1. 调用阿里云 STS AssumeRole 获取临时凭证
 * 2. 生成 OSS 上传签名（policy）
 * 3. 返回给前端
 */
export async function getOSSUploadSignature(
  fileName: string,
  projectId: number
): Promise<OSSSignature> {
  // ========== 模拟模式 ==========
  if (MOCK_STS) {
    console.log('[OSS-STS] 模拟模式：使用模拟凭证');
    const key = generateOSSKey(fileName, projectId);
    return {
      credentials: { ...mockCredentials },
      bucket: OSS_CONFIG.bucket,
      endpoint: OSS_CONFIG.endpoint,
      key,
      host: `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}`,
    };
  }
  // =============================
  
  // 请求后端获取 STS 临时凭证
  const response = await apiClient.post('/api/oss/sts', {
    fileName,
    projectId,
  });
  
  const data = response.data;
  
  return {
    credentials: {
      accessKeyId: data.accessKeyId,
      accessKeySecret: data.accessKeySecret,
      securityToken: data.securityToken,
      expiration: data.expiration,
    },
    bucket: OSS_CONFIG.bucket,
    endpoint: OSS_CONFIG.endpoint,
    key: data.key,
    host: `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}`,
  };
}

/**
 * 检查 STS 凭证是否过期
 */
function isCredentialsExpired(credentials: STSCredentials): boolean {
  const expirationTime = new Date(credentials.expiration).getTime();
  const now = Date.now();
  // 提前5分钟判断过期
  return now > expirationTime - 5 * 60 * 1000;
}

/**
 * 缓存的 STS 凭证
 */
let cachedCredentials: STSCredentials | null = null;
let cachedProjectId: number | null = null;

/**
 * 获取有效的 STS 凭证（带缓存）
 */
async function getValidCredentials(projectId: number): Promise<STSCredentials> {
  // 检查缓存的凭证是否有效
  if (cachedCredentials && 
      cachedProjectId === projectId && 
      !isCredentialsExpired(cachedCredentials)) {
    return cachedCredentials;
  }
  
  // ========== 模拟模式 ==========
  if (MOCK_STS) {
    console.log('[OSS-STS] 模拟模式：获取模拟凭证');
    cachedCredentials = { ...mockCredentials };
    cachedProjectId = projectId;
    return cachedCredentials;
  }
  // =============================
  
  // 重新获取凭证
  const response = await apiClient.post('/api/oss/sts/credentials', {
    projectId,
  });
  
  cachedCredentials = response.data;
  cachedProjectId = projectId;
  
  return cachedCredentials;
}

/**
 * 生成 OSS 上传路径
 */
function generateOSSKey(fileName: string, projectId: number): string {
  const timestamp = Date.now();
  const ext = fileName.split('.').pop() || 'png';
  const random = Math.random().toString(36).substr(2, 9);
  return `projects/${projectId}/assets/${timestamp}_${random}.${ext}`;
}

/**
 * 上传文件到 OSS（使用 STS 临时凭证）
 */
export async function uploadToOSSWithSTS(
  file: File,
  projectId: number
): Promise<string> {
  // ========== 模拟模式：直接返回模拟 URL ==========
  if (MOCK_STS) {
    const key = generateOSSKey(file.name, projectId);
    const mockUrl = `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/${key}`;
    console.log('[OSS-STS] 模拟模式：返回模拟 URL:', mockUrl);
    return mockUrl;
  }
  // ================================================
  
  try {
    // 1. 获取 STS 临时凭证
    const credentials = await getValidCredentials(projectId);
    
    // 2. 生成上传路径
    const key = generateOSSKey(file.name, projectId);
    const host = `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}`;
    
    // 3. 生成 policy（后端生成更安全，这里简化处理）
    const policyBase64 = btoa(JSON.stringify({
      expiration: credentials.expiration,
      conditions: [
        { bucket: OSS_CONFIG.bucket },
        ['starts-with', '$key', `projects/${projectId}/`],
      ]
    }));
    
    // 4. 构建 FormData 直传 OSS
    const formData = new FormData();
    formData.append('OSSAccessKeyId', credentials.accessKeyId);
    formData.append('Signature', generateSignature(policyBase64, credentials.accessKeySecret));
    formData.append('policy', policyBase64);
    formData.append('key', key);
    formData.append('file', file);
    formData.append('security-token', credentials.securityToken);
    
    // 5. 上传到 OSS
    const response = await fetch(host, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OSS 上传失败: ${response.status} - ${errorText}`);
    }
    
    // 6. 返回访问 URL
    const url = `${host}/${key}`;
    console.log('[OSS-STS] 上传成功:', url);
    
    return url;
  } catch (error) {
    console.error('[OSS-STS] 上传失败:', error);
    throw error;
  }
}

/**
 * 生成签名（简化版，实际应由后端生成）
 */
function generateSignature(policy: string, accessKeySecret: string): string {
  // 注意：这里只是简化实现
  // 实际应该使用 crypto-js 或后端生成完整签名
  // 推荐：后端直接返回完整 signature
  return btoa(policy + accessKeySecret);
}

/**
 * 上传 Base64 图片到 OSS
 */
export async function uploadBase64ToOSS(
  base64Data: string,
  projectId: number,
  fileName?: string
): Promise<string> {
  // 将 Base64 转换为 Blob
  const blob = await fetch(base64Data).then(r => r.blob());
  
  // 确定文件类型
  const extMatch = base64Data.match(/data:image\/(\w+);base64/);
  const ext = extMatch?.[1] || 'png';
  const name = fileName || `image_${Date.now()}.${ext}`;
  
  const file = new File([blob], name, { type: `image/${ext}` });
  
  return uploadToOSSWithSTS(file, projectId);
}

/**
 * 统一的上传函数
 * 支持 File、Base64、URL
 */
export async function uploadToOSS(
  source: File | string,
  projectId: number,
  fileName?: string
): Promise<string> {
  // 如果是 URL，直接返回
  if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
    return source;
  }
  
  // 如果是 Base64
  if (typeof source === 'string' && source.startsWith('data:')) {
    return uploadBase64ToOSS(source, projectId, fileName);
  }
  
  // 如果是 File
  if (source instanceof File) {
    return uploadToOSSWithSTS(source, projectId);
  }
  
  throw new Error('不支持的上传类型');
}

/**
 * 获取 OSS 公开访问地址
 */
export function getOSSUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/${path}`;
}

/**
 * 清除缓存的 STS 凭证
 */
export function clearCachedCredentials(): void {
  cachedCredentials = null;
  cachedProjectId = null;
}
