import { apiClient } from './client';

const OSS_CONFIG = {
  bucket: 'huanu',
  endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
};

type StsCredentials = {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration?: string;
};

let cachedCredentials: StsCredentials | null = null;
let credentialsExpireTime = 0;
let ossModulePromise: Promise<any> | null = null;

const CACHE_BUFFER_TIME = 5 * 60 * 1000;

const loadOSS = async () => {
  if (!ossModulePromise) {
    ossModulePromise = import('ali-oss').then((module) => module.default ?? module);
  }
  return ossModulePromise;
};

async function getSTSCredentials(): Promise<StsCredentials> {
  const now = Date.now();
  if (cachedCredentials && credentialsExpireTime > now + CACHE_BUFFER_TIME) {
    return cachedCredentials;
  }

  const response = await apiClient.get('/oss/sts-credentials');
  const data = response.data;

  if (data.code !== 0 || !data.data) {
    throw new Error(data.message || '获取 STS 凭证失败');
  }

  cachedCredentials = data.data as StsCredentials;
  if (cachedCredentials.expiration) {
    credentialsExpireTime = new Date(cachedCredentials.expiration).getTime();
  }

  return cachedCredentials;
}

async function createOSSClient() {
  const OSS = await loadOSS();
  const credentials = await getSTSCredentials();

  return new OSS({
    bucket: OSS_CONFIG.bucket,
    endpoint: OSS_CONFIG.endpoint,
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    stsToken: credentials.securityToken,
    authorizationV4: true,
    refreshSTSToken: async () => {
      const nextCredentials = await getSTSCredentials();
      return {
        accessKeyId: nextCredentials.accessKeyId,
        accessKeySecret: nextCredentials.accessKeySecret,
        stsToken: nextCredentials.securityToken,
      };
    },
    refreshSTSTokenInterval: 30 * 60 * 1000,
  });
}

function generateOSSKey(fileName: string, projectId: number, pathPrefix?: string): string {
  const timestamp = Date.now();
  const ext = fileName.split('.').pop() || 'png';
  const random = Math.random().toString(36).slice(2, 11);
  const prefix = pathPrefix || `projects/${projectId}/assets/`;
  return `${prefix}${timestamp}_${random}.${ext}`;
}

export async function uploadToOSS(
  file: File,
  projectId: number,
  onSuccess?: (key: string, url: string) => Promise<void>,
  pathPrefix?: string
): Promise<string> {
  const client = await createOSSClient();
  const key = generateOSSKey(file.name, projectId, pathPrefix);
  const result = await client.put(key, file);
  const url = result.url;

  if (onSuccess) {
    onSuccess(key, url).catch((error) => {
      console.error('[OSS] post-upload callback failed:', error);
    });
  }

  return url;
}

export function getOSSUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${OSS_CONFIG.endpoint}/${path}`;
}

export function clearOSSCredentials(): void {
  cachedCredentials = null;
  credentialsExpireTime = 0;
}

export interface OSSFile {
  name: string;
  url: string;
  lastModified: string;
  size: number;
  type: 'image' | 'video' | 'other';
}

export async function listProjectFiles(projectId: number, limit: number = 100): Promise<OSSFile[]> {
  const client = await createOSSClient();
  const allFiles: OSSFile[] = [];
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
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
        const ext = file.name?.toLowerCase().slice(file.name.lastIndexOf('.')) || '';

        let type: OSSFile['type'] = 'other';
        if (imageExts.includes(ext)) {
          type = 'image';
        } else if (videoExts.includes(ext)) {
          type = 'video';
        } else {
          continue;
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

  allFiles.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  return allFiles.slice(0, limit * 2);
}

export async function listProjectImages(projectId: number, limit: number = 100): Promise<OSSFile[]> {
  const allFiles = await listProjectFiles(projectId, limit);
  return allFiles.filter((file) => file.type === 'image').slice(0, limit);
}

export async function listProjectVideos(projectId: number, limit: number = 100): Promise<OSSFile[]> {
  const allFiles = await listProjectFiles(projectId, limit);
  return allFiles.filter((file) => file.type === 'video').slice(0, limit);
}
