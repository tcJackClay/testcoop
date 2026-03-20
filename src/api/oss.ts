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
 * @param fileName 文件名
 * @param projectId 项目 ID
 * @param pathPrefix 路径前缀，默认 projects/{id}/assets/
 */
function generateOSSKey(fileName: string, projectId: number, pathPrefix?: string): string {
  const timestamp = Date.now();
  const ext = fileName.split('.').pop() || 'png';
  const random = Math.random().toString(36).substr(2, 9);
  const prefix = pathPrefix || `projects/${projectId}/assets/`;
  return `${prefix}${timestamp}_${random}.${ext}`;
}

/**
 * 使用 ali-oss SDK 上传文件
 * @param file 要上传的文件
 * @param projectId 项目 ID
 * @param onSuccess 上传成功后的回调（异步），参数为 OSS key
 * @param pathPrefix 自定义路径前缀，如 temp/{id}/（可选）
 */
export async function uploadToOSS(
  file: File,
  projectId: number,
  onSuccess?: (key: string, url: string) => Promise<void>,
  pathPrefix?: string
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
  const key = generateOSSKey(file.name, projectId, pathPrefix);
  console.log('[OSS Step 3] 生成 key:', key);
  
  console.log('[OSS Step 4] 上传到 OSS...');
  const result = await client.put(key, file);
  console.log('[OSS Step 4] 上传结果:', result);
  
  // 4. 返回 URL
  const url = result.url;
  console.log('[OSS Step 5] 上传成功, url:', url);
  console.log('[OSS] ====== 上传流程结束 ======');
  
  // 5. 上传成功后异步执行回调
  if (onSuccess) {
    onSuccess(key, url).catch(err => {
      console.error('[OSS] 上传成功回调执行失败:', err);
    });
  }
  
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

/**
 * OSS 文件信息
 */
export interface OSSFile {
  name: string;      // 文件名（含路径）
  url: string;       // 完整访问 URL
  lastModified: string;  // 最后修改时间
  size: number;      // 文件大小 (bytes)
  type: 'image' | 'video' | 'other';
}

/**
 * 获取项目在 OSS 的所有文件（临时文件 + 已保存资产）
 * @param projectId 项目 ID
 * @param limit 限制数量
 */
export async function listProjectFiles(projectId: number, limit: number = 100): Promise<OSSFile[]> {
  // 获取 STS 凭证
  const credentials = await getSTSCredentials();
  
  // 创建 OSS 客户端（带自动刷新凭证）
  const client = new OSS({
    bucket: OSS_CONFIG.bucket,
    endpoint: OSS_CONFIG.endpoint,
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    stsToken: credentials.securityToken,
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
    refreshSTSTokenInterval: 30 * 60 * 1000, // 每30分钟检查刷新
  });
  
  const allFiles: OSSFile[] = [];
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  
  // 需要检查的目录
  const prefixes = [
    `temp/${projectId}/`,
    `projects/${projectId}/assets/`,
  ];
  
  for (const prefix of prefixes) {
    let continuationToken: string | undefined;
    
    do {
      const result = await client.listV2({
        prefix,
        'max-keys': 100,
        continuationToken,
      });
      
      const files = result.objects || [];
      
      for (const file of files) {
        const ext = file.name?.toLowerCase().substring(file.name.lastIndexOf('.')) || '';
        
        let type: 'image' | 'video' | 'other' = 'other';
        if (imageExts.includes(ext)) {
          type = 'image';
        } else if (videoExts.includes(ext)) {
          type = 'video';
        } else {
          continue; // 跳过非图片/视频文件
        }
        
        allFiles.push({
          name: file.name,
          url: file.url || `${OSS_CONFIG.endpoint}/${file.name}`,
          lastModified: file.lastModified,
          size: file.size,
          type,
        });
      }
      
      continuationToken = result.nextContinuationToken;
    } while (continuationToken && allFiles.length < limit * 2);
  }
  
  // 按最后修改时间倒序排列
  allFiles.sort((a, b) => 
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );
  
  // 分别返回图片和视频（各限制 limit 个）
  return allFiles.slice(0, limit * 2);
}

/**
 * 获取项目的图片列表
 */
export async function listProjectImages(projectId: number, limit: number = 100): Promise<OSSFile[]> {
  const allFiles = await listProjectFiles(projectId, limit);
  return allFiles.filter(f => f.type === 'image').slice(0, limit);
}

/**
 * 获取项目的视频列表
 */
export async function listProjectVideos(projectId: number, limit: number = 100): Promise<OSSFile[]> {
  const allFiles = await listProjectFiles(projectId, limit);
  return allFiles.filter(f => f.type === 'video').slice(0, limit);
}
