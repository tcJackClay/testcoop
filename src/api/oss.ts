/**
 * OSS 上传工具
 * 使用 ali-oss SDK 上传
 * 带 STS 凭证缓存机制
 */

// @ts-ignore
import OSS from 'ali-oss';

import { apiClient } from './client';

// OSS 配置
const OSS_CONFIG = {
  bucket: 'huanu',
  endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
};

// STS 凭证缓存
let cachedCredentials: any = null;
let credentialsExpireTime: number = 0;
const CACHE_BUFFER_TIME = 5 * 60 * 1000; // 提前5分钟刷新

/**
 * 获取 STS 凭证（带缓存）
 */
async function getSTSCredentials() {
  const now = Date.now();
  console.log('[OSS] 缓存检查: cachedCredentials=', !!cachedCredentials, 'credentialsExpireTime=', credentialsExpireTime, 'now=', now);
  
  // 检查缓存是否有效（过期时间 - 缓冲时间 > 当前时间）
  if (cachedCredentials && credentialsExpireTime > now + CACHE_BUFFER_TIME) {
    console.log('[OSS] 使用缓存的 STS 凭证, 过期时间:', new Date(credentialsExpireTime).toLocaleString());
    return cachedCredentials;
  }
  
  console.log('[OSS] 缓存无效或不存在，需要重新请求');
  
  console.log('[OSS Step 1.1] 请求 STS 凭证...');
  const response = await apiClient.get('/oss/sts-credentials');
  console.log('[OSS Step 1.1] 响应状态:', response.status);
  console.log('[OSS Step 1.1] 响应完整数据:', JSON.stringify(response.data, null, 2));
  
  const data = response.data;
  
  if (data.code !== 0 || !data.data) {
    console.error('[OSS Step 1.1] 获取失败, code:', data.code, 'msg:', data.message);
    throw new Error(data.message || '获取 STS 凭证失败');
  }
  
  // 缓存凭证
  cachedCredentials = data.data;
  
  // 解析过期时间
  if (data.data.expiration) {
    credentialsExpireTime = new Date(data.data.expiration).getTime();
    console.log('[OSS] STS 凭证缓存成功, 过期时间:', new Date(credentialsExpireTime).toLocaleString());
  }
  
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
 * 使用 ali-oss SDK 上传文件
 */
export async function uploadToOSS(
  file: File,
  projectId: number
): Promise<string> {
  console.log('[OSS] ====== 开始上传流程 ======');
  
  // 1. 获取 STS 凭证
  console.log('[OSS Step 1] 获取 STS 凭证...');
  const credentials = await getSTSCredentials();
  console.log('[OSS Step 1] 凭证获取成功');
  
  // 2. 创建 OSS 客户端（带自动刷新）
  console.log('[OSS Step 2] 创建 OSS 客户端...');
  const client = new OSS({
    bucket: OSS_CONFIG.bucket,
    endpoint: OSS_CONFIG.endpoint,
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    stsToken: credentials.securityToken,
    authorizationV4: true,
    // 自动刷新凭证
    refreshSTSToken: async () => {
      console.log('[OSS] 凭证即将过期，自动刷新...');
      const newCredentials = await getSTSCredentials();
      return {
        accessKeyId: newCredentials.accessKeyId,
        accessKeySecret: newCredentials.accessKeySecret,
        stsToken: newCredentials.securityToken,
      };
    },
    refreshSTSTokenInterval: 30 * 60 * 1000,
  });
  console.log('[OSS Step 2] OSS 客户端创建成功');
  
  // 3. 生成 key 并上传
  const key = generateOSSKey(file.name, projectId);
  console.log('[OSS Step 3] 生成 key:', key);
  
  console.log('[OSS Step 4] 上传到 OSS...');
  const result = await client.put(key, file);
  console.log('[OSS Step 4] 上传结果:', result);
  
  // 4. 返回 URL
  const url = result.url;
  console.log('[OSS Step 5] 上传成功, url:', url);
  console.log('[OSS] ====== 上传流程结束 ======');
  
  return url;
}

/**
 * 获取 OSS 公开访问地址
 */
export function getOSSUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${OSS_CONFIG.endpoint}/${path}`;
}

/**
 * 清除缓存的 STS 凭证
 */
export function clearOSSCredentials(): void {
  cachedCredentials = null;
  credentialsExpireTime = 0;
}
