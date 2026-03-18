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

  // 后台异步保存到资产库
  const saveToAssetLibrary = async (nodeData: any, options: UpscaleOptions) => {
    try {
      const newImage = await imageApi.create({
        resourceName: nodeData.pendingSync.resourceName,
        resourceType: 'image',
        resourceContent: nodeData.pendingSync.resourceContent,
        projectId: nodeData.pendingSync.projectId,
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
      // 1. 获取当前图片（使用 img + canvas 绕过 CORS）
      let file: File | null = null;
      let useOriginalUrl = false;
      
      try {
        file = await loadImageAsFile(displayImageUrl);
      } catch (loadErr) {
        console.error('[useUpscale] 图片加载失败，使用原图URL:', loadErr);
        useOriginalUrl = true;
      }

      // 如果无法加载文件，直接使用原图 URL
      if (useOriginalUrl || !file) {
        // 直接创建节点，使用原图
        const projectId = getProjectId();
        const currentAssetId = data.assetId || data.imageUrl;
        const currentEx2 = currentAssetId ? (data.ex2 ? JSON.parse(data.ex2) : []) : [];

        createResultNode(displayImageUrl, displayImageUrl, {
          resourceName: `${data.label || '图片'}-高清放大`,
          resourceContent: displayImageUrl,
          projectId,
          currentAssetId: Number(currentAssetId) || 0,
          sourceNodeId: nodeId,
          label: data.label || '图片',
          displayImageUrl,
          currentEx2,
        });

        updateData('status', 'completed');
        updateData('processInfo', '高清放大');
        setIsUpscaling(false);
        return;
      }

      // 2. 获取 RunningHub 配置
      const upscaleFunc = DEFAULT_FUNCTIONS.find(f => f.id === 'ai_image_upscale');
      if (!upscaleFunc) throw new Error('未找到图片放大功能');

      // 3. 获取节点信息
      const { nodeInfoList } = await runningHubApi.getNodeInfo(upscaleFunc.webappId!);

      // 4. 通过后端上传文件到 RunningHub
      const uploadResult = await runningHubApi.uploadFileViaBackend(file);
      if (!uploadResult.success || !uploadResult.fileName) {
        throw new Error(uploadResult.error || '图片上传失败');
      }

      console.log('[useUpscale] 文件上传成功, fileName:', uploadResult.fileName);

      // 5. 通过后端提交任务（后端同步等待，最多30分钟）
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

      // 后端同步返回结果
      const resultImage = taskResult.fileUrl || '';
      const savedImageUrl = resultImage;

      // 6. 创建结果节点
      const projectId = getProjectId();
      const currentAssetId = data.assetId || data.imageUrl;
      const currentEx2 = currentAssetId ? (data.ex2 ? JSON.parse(data.ex2) : []) : [];

      createResultNode(resultImage, savedImageUrl, {
        resourceName: `${data.label || '图片'}-高清放大`,
        resourceContent: savedImageUrl,
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
