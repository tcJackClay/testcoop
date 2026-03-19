/**
 * useUpscale - 高清放大逻辑
 */
import { useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { imageApi } from '@/api/image';
import { runningHubApi, DEFAULT_FUNCTIONS } from '@/api/runningHub';
import type { UpscaleOptions, ProcessChainItem } from '../ImageNode.types';

/**
 * 使用 img + canvas 加载跨域图片（绕过 CORS）
 */
const loadImageAsFile = (imageUrl: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `upscale-${Date.now()}.png`, { type: 'image/png' });
          resolve(file);
        } else {
          reject(new Error('无法转换图片'));
        }
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageUrl;
  });
};

interface UseUpscaleOptions {
  nodeId: string;
  data: {
    assetId?: number;
    imageUrl?: string;
    label?: string;
    assetData?: any;
    ex2?: string;
    processFrom?: string;
  };
  updateData: (key: string, value: unknown) => void;
  displayImageUrl: string;
}

export function useUpscale({ nodeId, data, updateData, displayImageUrl }: UseUpscaleOptions) {
  const [isUpscaling, setIsUpscaling] = useState(false);

  // 获取项目 ID
  const getProjectId = (): number => {
    const projectStorage = localStorage.getItem('project-storage');
    return projectStorage ? JSON.parse(projectStorage).state?.currentProjectId : 1;
  };

  // 创建结果节点
  const createResultNode = (
    resultImage: string,
    savedImageUrl: string,
    options: UpscaleOptions
  ) => {
    console.log('[useUpscale] createResultNode options:', {
      currentAssetId: options.currentAssetId,
      label: options.label,
      currentEx2Length: options.currentEx2?.length
    });
    
    const canvasStore = useCanvasStore.getState();
    const currentNode = canvasStore.nodes.find(n => n.id === nodeId);
    const currentPos = currentNode?.position || { x: 0, y: 0 };

    // 检查是否有处理历史
    const currentEx2 = currentNode?.data?.ex2 
      ? JSON.parse(currentNode.data.ex2 as string) 
      : [];
    const hasHistory = currentEx2.length > 0 || currentNode?.data?.processFrom;

    const nodeData: any = {
      imageUrl: resultImage,
      assetId: null,
      label: `${options.label}-放大`,
      status: 'completed',
      processInfo: '高清放大',
      processFrom: nodeId,
      pendingSync: {
        resourceName: options.resourceName,
        resourceContent: savedImageUrl || resultImage,
        projectId: options.projectId,
        currentAssetId: options.currentAssetId,
      }
    };

    if (hasHistory) {
      nodeData.originalImageUrl = options.displayImageUrl;
      nodeData.processChain = options.currentEx2;
      canvasStore.addNode('historyNode', { x: currentPos.x + 350, y: currentPos.y }, { data: nodeData });
    } else {
      canvasStore.addNode('imageNode', { x: currentPos.x + 350, y: currentPos.y }, { data: nodeData });
    }

    // 添加连线
    setTimeout(() => {
      const canvasStore2 = useCanvasStore.getState();
      const newNode = canvasStore2.nodes.find(
        n => n.data?.pendingSync?.resourceName === nodeData.pendingSync.resourceName
      );
      if (newNode && canvasStore2.addConnection) {
        if (!canvasStore2.isConnected(nodeId, newNode.id)) {
          canvasStore2.addConnection(nodeId, newNode.id);
        }
      }
    }, 200);

    // 启动后台保存
    saveToAssetLibrary(nodeData, options);
  };

  // 获取当前用户 ID
  const getCurrentUserId = (): number => {
    try {
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id || 1;
      }
    } catch {}
    return 1;
  };

  // 后台异步保存到资产库
  const saveToAssetLibrary = async (nodeData: any, options: UpscaleOptions) => {
    try {
      const userId = getCurrentUserId();
      const newImage = await imageApi.create({
        resourceName: nodeData.pendingSync.resourceName,
        resourceType: 'image',
        resourceContent: nodeData.pendingSync.resourceContent,
        projectId: nodeData.pendingSync.projectId,
        userId: userId,
      });

      if (newImage && newImage.id) {
        // 更新节点 assetId
        const canvasStore = useCanvasStore.getState();
        const targetNode = canvasStore.nodes.find(
          n => n.data?.pendingSync?.resourceName === nodeData.pendingSync.resourceName
        );
        if (targetNode) {
          canvasStore.updateNode(targetNode.id, {
            data: {
              ...targetNode.data,
              assetId: newImage.id,
              imageUrl: newImage.id.toString(),
              pendingSync: null
            }
          });

          // 异步更新源资产 ext2（从服务端获取最新数据）
          if (nodeData.pendingSync.currentAssetId) {
            try {
              console.log('[useUpscale] 更新源资产 ext2, currentAssetId:', nodeData.pendingSync.currentAssetId);
              
              // 先从服务端获取源资产的最新信息
              const sourceAsset = await imageApi.getById(Number(nodeData.pendingSync.currentAssetId));
              console.log('[useUpscale] 获取源资产响应:', sourceAsset);
              
              let sourceEx2: ProcessChainItem[] = [];
              if (sourceAsset?.ext2) {
                try {
                  sourceEx2 = JSON.parse(sourceAsset.ext2);
                } catch {}
              }
              console.log('[useUpscale] 解析后 sourceEx2:', sourceEx2);

              const newRecord: ProcessChainItem = {
                type: '高清放大',
                targetId: newImage.id,
                targetPath: '',
                timestamp: Date.now()
              };

              await imageApi.put(Number(nodeData.pendingSync.currentAssetId), {
                ext2: JSON.stringify([...sourceEx2, newRecord])
              });
              
              console.log('[useUpscale] 源资产 ext2 更新成功:', { before: sourceEx2.length, after: sourceEx2.length + 1 });
            } catch (ext2Err) {
              console.error('[useUpscale] 源资产 ext2 更新失败:', ext2Err);
            }
          }
        }
      }
    } catch (err) {
      console.error('[useUpscale] 后台保存失败:', err);
    }
  };

  // 正式模式：调用 RunningHub
  const upscaleWithRunningHub = async () => {
    setIsUpscaling(true);
    updateData('status', 'processing');

    try {
      // 1. 获取 RunningHub 配置
      const upscaleFunc = DEFAULT_FUNCTIONS.find(f => f.id === 'ai_image_upscale');
      if (!upscaleFunc) throw new Error('未找到图片放大功能');

      console.log('[useUpscale] 开始放大, imageUrl:', displayImageUrl);

      // 2. 检测图片来源并处理
      let file: File | null = null;
      
      // 检查是否是 data URL（本地文件）
      if (displayImageUrl.startsWith('data:')) {
        // 本地文件，转换为 File
        const response = await fetch(displayImageUrl);
        const blob = await response.blob();
        file = new File([blob], `image-${Date.now()}.png`, { type: blob.type || 'image/png' });
      } else {
        // OSS 图片，尝试使用 img + canvas
        try {
          file = await loadImageAsFile(displayImageUrl);
        } catch (loadErr) {
          console.error('[useUpscale] 图片加载失败:', loadErr);
          throw new Error('图片加载失败，请确保图片可以访问');
        }
      }

      if (!file) {
        throw new Error('无法获取图片文件');
      }

      // 3. 上传文件到 RunningHub
      const uploadResult = await runningHubApi.uploadFileViaBackend(file);
      if (!uploadResult.success || !uploadResult.fileName) {
        throw new Error(uploadResult.error || '图片上传失败');
      }

      console.log('[useUpscale] 文件上传成功, fileName:', uploadResult.fileName);

      // 4. 获取节点信息并提交任务
      const { nodeInfoList } = await runningHubApi.getNodeInfo(upscaleFunc.webappId!);

      // 5. 提交任务并等待结果
      const taskResult = await runningHubApi.submitTaskViaBackend(upscaleFunc.webappId!, [
        {
          nodeId: nodeInfoList[0].nodeId,
          fieldName: nodeInfoList[0].fieldName,
          fieldValue: uploadResult.fileName
        }
      ]);

      if (!taskResult.success || !taskResult.fileUrl) {
        throw new Error(taskResult.error || '任务执行失败');
      }

      console.log('[useUpscale] 任务完成, result:', taskResult);

      // 6. 创建结果节点
      const resultImageUrl = Array.isArray(taskResult.fileUrl) ? taskResult.fileUrl[0]?.fileUrl : taskResult.fileUrl;
      const projectId = getProjectId();
      const currentAssetId = data.assetId || data.imageUrl;
      const currentEx2 = currentAssetId ? (data.ex2 ? JSON.parse(data.ex2) : []) : [];

      createResultNode(resultImageUrl, resultImageUrl, {
        resourceName: `${data.label || '图片'}-高清放大`,
        resourceContent: resultImageUrl,
        projectId,
        currentAssetId: Number(currentAssetId) || 0,
        sourceNodeId: nodeId,
        label: data.label || '图片',
        displayImageUrl,
        currentEx2,
      });

      // 更新当前节点状态
      updateData('status', 'completed');
      updateData('processInfo', '高清放大');

      // 触发浏览器下载
      if (resultImageUrl) {
        const link = document.createElement('a');
        link.href = resultImageUrl;
        link.download = `${data.label || '图片'}-高清放大-${Date.now()}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (err) {
      console.error('[useUpscale] 高清放大失败:', err);
      updateData('status', 'failed');
      updateData('error', err instanceof Error ? err.message : '高清放大失败');
    } finally {
      setIsUpscaling(false);
    }
  };

  // 测试模式
  const upscaleMock = async () => {
    setIsUpscaling(true);
    updateData('status', 'processing');

    try {
      const savedImageUrl = displayImageUrl;
      const projectId = getProjectId();
      const currentAssetId = data.assetId || data.imageUrl;
      const currentEx2 = currentAssetId ? (data.ex2 ? JSON.parse(data.ex2) : []) : [];

      // 直接创建节点
      createResultNode(displayImageUrl, savedImageUrl, {
        resourceName: `${data.label || '图片'}-高清放大`,
        resourceContent: savedImageUrl,
        projectId,
        currentAssetId: Number(currentAssetId) || 0,
        sourceNodeId: nodeId,
        label: data.label || '图片',
        displayImageUrl,
        currentEx2,
      });

      updateData('status', 'completed');
      updateData('processInfo', '高清放大');
    } catch (err) {
      console.error('[useUpscale] 测试模式失败:', err);
      updateData('status', 'failed');
    } finally {
      setIsUpscaling(false);
    }
  };

  return {
    isUpscaling,
    upscaleWithRunningHub,
    upscaleMock,
  };
}
