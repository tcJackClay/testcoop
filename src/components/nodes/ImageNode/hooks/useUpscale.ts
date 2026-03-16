/**
 * useUpscale - 高清放大逻辑
 */
import { useState, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { imageApi } from '@/api/image';
import { runningHubApi, DEFAULT_FUNCTIONS } from '@/api/runningHub';
import { uploadToOSS } from '@/api/oss';
import type { UpscaleOptions, ProcessChainItem } from '../ImageNode.types';

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
  const pollTaskRef = useRef<() => void>();

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
      // 1. 获取当前图片
      const response = await fetch(displayImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `upscale-${Date.now()}.png`, { type: 'image/png' });

      // 2. 获取 RunningHub 配置
      const upscaleFunc = DEFAULT_FUNCTIONS.find(f => f.id === 'ai_image_upscale');
      if (!upscaleFunc) throw new Error('未找到图片放大功能');

      // 3. 获取节点信息
      const { nodeInfoList } = await runningHubApi.getNodeInfo(upscaleFunc.webappId!);

      // 4. 上传图片
      const uploadResult = await runningHubApi.uploadFileDirect(file);
      if (!uploadResult.success || !uploadResult.fileName) {
        throw new Error(uploadResult.error || '图片上传失败');
      }

      // 5. 提交任务
      const taskSubmitResult = await runningHubApi.submitTaskDirect(upscaleFunc.webappId!, [
        {
          nodeId: nodeInfoList[0].nodeId,
          fieldName: nodeInfoList[0].fieldName,
          fieldValue: uploadResult.fileName
        }
      ]);

      if (!taskSubmitResult.success || !taskSubmitResult.taskId) {
        throw new Error('任务提交失败');
      }

      const taskId = taskSubmitResult.taskId;
      console.log('[useUpscale] 任务ID:', taskId);

      // 6. 轮询任务状态
      let resultImage = '';
      let savedImageUrl = '';
      let uploadSuccess = false;
      let newAssetEx2: ProcessChainItem[] = [];
      const maxRetries = 3;
      let retryCount = 0;

      const pollTask = async () => {
        const taskResult = await runningHubApi.queryTaskDirect(taskId);
        const { status, imageUrl, error } = taskResult;

        console.log('[useUpscale] 任务状态:', status, imageUrl);

        if (status === 'success' && imageUrl) {
          resultImage = imageUrl;

          if (resultImage) {
            // 7. 下载处理后的图片
            const imgResponse = await fetch(resultImage);
            const imgBlob = await imgResponse.blob();
            const imgFile = new File([imgBlob], `upscale-${Date.now()}.png`, { type: 'image/png' });

            // 8. 上传到 OSS
            const projectId = getProjectId();
            while (retryCount < maxRetries && !uploadSuccess) {
              try {
                // ========== 使用 OSS 上传 ==========
                savedImageUrl = await uploadToOSS(imgFile, projectId);
                console.log('[useUpscale] OSS 上传成功:', savedImageUrl);
                uploadSuccess = true;
                // =================================
              } catch (err) {
                console.error('[useUpscale] OSS 上传失败:', err);
                retryCount++;
                if (retryCount < maxRetries) await new Promise(r => setTimeout(r, 1000));
              }
            }

            // 9. 创建结果节点（先显示，后台保存）
            const currentAssetId = data.assetId || data.imageUrl;
            const currentEx2 = currentAssetId 
              ? (data.ex2 ? JSON.parse(data.ex2) : [])
              : [];

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
          }
        } else if (status === 'failed') {
          updateData('status', 'failed');
          updateData('error', error || '任务执行失败');
        } else {
          setTimeout(pollTask, 2000);
        }
      };

      pollTask();
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
