/**
 * useImageUpload - 图片上传逻辑
 */
import { useRef, useCallback } from 'react';
import { imageApi } from '@/api/image';
import { uploadToOSS } from '@/api/oss';

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

    // 读取文件为 base64（用于即时预览）
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // ========== 只显示预览，不上传 ==========
      updateData('imageUrl', base64);
      updateData('status', 'idle');
      // 上传由用户主动触发（如点击"保存"按钮）
      // ========================================
    };
    reader.readAsDataURL(file);

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
