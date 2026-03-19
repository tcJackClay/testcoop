/**
 * useImageUpload - 图片上传逻辑
 */
import { useRef, useCallback } from 'react';
import { apiClient } from '@/api/client';

interface UseImageUploadOptions {
  nodeId: string;
  data: {
    label?: string;
  };
  updateData: (key: string, value: unknown) => void;
  onImageLoaded?: (imageUrl: string) => void;
}

export function useImageUpload({ nodeId, data, updateData, onImageLoaded }: UseImageUploadOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getProjectId = (): number => {
    const projectStorage = localStorage.getItem('project-storage');
    return projectStorage ? JSON.parse(projectStorage).state?.currentProjectId : 1;
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const projectId = getProjectId();

    try {
      // 直接上传到 OSS（临时路径）
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const ossKey = `temp/${projectId}/${timestamp}_${random}.${file.name.split('.').pop() || 'png'}`;
      
      console.log('[useImageUpload] 开始上传, projectId:', projectId, 'ossKey:', ossKey);
      
      // @ts-ignore
      const OSS = (await import('ali-oss')).default;
      const stsResponse = await apiClient.get('/oss/sts-credentials');
      console.log('[useImageUpload] STS 响应:', stsResponse.data);
      
      const credentials = stsResponse.data.data;
      if (!credentials) {
        throw new Error('获取 STS 凭证失败: ' + JSON.stringify(stsResponse.data));
      }
      
      const client = new OSS({
        bucket: 'huanu',
        endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
        accessKeyId: credentials.accessKeyId,
        accessKeySecret: credentials.accessKeySecret,
        stsToken: credentials.securityToken,
      });
      
      const result = await client.put(ossKey, file);
      console.log('[useImageUpload] 上传结果:', result);
      const ossUrl = result.url;
      
      // 存储 OSS URL 而不是 base64
      updateData('imageUrl', ossUrl);
      updateData('status', 'idle');
    } catch (error) {
      console.error('[useImageUpload] 上传失败:', error);
    }

    // 清空 input，允许重复选择同一文件
    e.target.value = '';
  }, [nodeId, updateData]);

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // ========== 只显示预览，不上传 ==========
      updateData('imageUrl', base64);
      updateData('status', 'idle');
      // 上传由用户主动触发
      // ========================================
    };
    reader.readAsDataURL(file);
  }, [updateData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return {
    fileInputRef,
    handleImageUpload,
    triggerUpload,
    handleDrop,
    handleDragOver,
  };
}
