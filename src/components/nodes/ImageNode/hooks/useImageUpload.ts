/**
 * useImageUpload - 图片上传逻辑
 */
import { useRef, useCallback } from 'react';
import { imageApi } from '@/api/image';

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

    // 读取文件为 base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // 更新节点显示
      updateData('imageUrl', base64);
      updateData('status', 'completed');
      
      // 保存到资产库
      try {
        const projectId = getProjectId();
        const newImage = await imageApi.create({
          resourceName: file.name,
          resourceType: 'image',
          resourceContent: base64,
          projectId,
        });

        if (newImage && newImage.id) {
          updateData('assetId', newImage.id);
          updateData('imageUrl', newImage.id.toString());
          
          onImageLoaded?.(newImage.id.toString());
        }
      } catch (err) {
        console.error('[useImageUpload] 保存失败:', err);
      }
    };
    reader.readAsDataURL(file);

    // 清空 input，允许重复选择同一文件
    e.target.value = '';
  }, [nodeId, updateData, onImageLoaded]);

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
      updateData('imageUrl', base64);
      updateData('status', 'completed');
      
      try {
        const projectId = getProjectId();
        const newImage = await imageApi.create({
          resourceName: file.name,
          resourceType: 'image',
          resourceContent: base64,
          projectId,
        });

        if (newImage && newImage.id) {
          updateData('assetId', newImage.id);
          updateData('imageUrl', newImage.id.toString());
        }
      } catch (err) {
        console.error('[useImageUpload] 保存失败:', err);
      }
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
