/**
 * useImageUpload - 图片上传逻辑
 */
import { useRef, useCallback } from 'react';
import { uploadToOSS } from '@/api/oss';
import { projectApi } from '@/api/project';

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
      console.log('[useImageUpload] 开始上传, projectId:', projectId);
      
      // 使用 uploadToOSS，上传成功后自动记录到历史
      // temp/ 路径用于临时草稿图片
      const ossUrl = await uploadToOSS(
        file, 
        projectId, 
        async (key, url) => {
          await projectApi.addHistoryRecord(projectId, {
            name: key,
            url: url,
            type: 'image'
          });
          console.log('[useImageUpload] 已记录到历史记录:', key);
        },
        `temp/${projectId}/`
      );
      
      console.log('[useImageUpload] 上传结果:', ossUrl);
      
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
