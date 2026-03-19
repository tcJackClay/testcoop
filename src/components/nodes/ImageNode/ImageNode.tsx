/**
 * ImageNode - AI绘图节点组件
 * 重构后主组件 - 约 200 行
 */
import { useState, useRef } from 'react';
import { imageApi } from '@/api/image';
import { runningHubApi, DEFAULT_FUNCTIONS } from '@/api/runningHub';
import { useUpscale, useImageFetch, useImageUpload, useImageDownload } from './hooks';
import { ImageToolbar } from './ImageToolbar';
import { GenerationSettings } from './GenerationSettings';
import { ImagePreview } from './ImagePreview';
import { ProcessInfo } from './ProcessInfo';
import { generateImage } from '@/api/promptGen';
import { getInputAssetId, appendToAssetChain } from '@/utils/assetChain';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ImageNodeData } from './ImageNode.types';

interface ImageNodeProps {
  nodeId: string;
  data: ImageNodeData;
  updateData: (key: string, value: unknown) => void;
  selected?: boolean;
}

// 是否启用测试模式
const MOCK_MODE = false;

export default function ImageNode({ nodeId, data, updateData, selected = false }: ImageNodeProps) {
  // ========== State ==========
  const [showSettings, setShowSettings] = useState(false);
  const [activeTool, setActiveTool] = useState<'generate' | 'multiAngle' | 'lighting' | 'upscale' | 'removeWatermark' | 'download' | null>(null);
  
  // ========== Hooks ==========
  const { displayImageUrl, processChainImages } = useImageFetch({
    imageUrl: data.imageUrl,
    assetId: data.assetId,
    processChain: data.processChain,
    ex2: data.ex2,
  });

  const { fileInputRef, handleImageUpload, triggerUpload } = useImageUpload({
    nodeId,
    data: { label: data.label },
    updateData,
  });

  const { handleDownload } = useImageDownload({ displayImageUrl });

  const { isUpscaling, upscaleWithRunningHub, upscaleMock } = useUpscale({
    nodeId,
    data: {
      assetId: data.assetId,
      imageUrl: data.imageUrl,
      label: data.label,
      assetData: data.assetData,
      ex2: data.ex2,
      processFrom: data.processFrom,
    },
    updateData,
    displayImageUrl,
  });

  // ========== Computed ==========
  const isProcessing = data.status === 'processing' || isUpscaling;
  const hasImage = !!displayImageUrl;
  const retryInfo = data.retryInfo;

  // ========== Handlers ==========
  const handleGenerate = async () => {
    if (!data.prompt) return;

    updateData('status', 'processing');

    try {
      // 如果已有图片，需要先上传到 OSS 获取 URL
      let imageURL: string | undefined;
      if (displayImageUrl && !displayImageUrl.startsWith('data:') && !displayImageUrl.startsWith('blob:')) {
        // 已有图片 URL，直接使用
        imageURL = displayImageUrl;
      } else if (displayImageUrl && (displayImageUrl.startsWith('data:') || displayImageUrl.startsWith('blob:'))) {
        // base64 或 blob，需要上传到 OSS（临时路径）
        const projectId = useCanvasStore.getState().currentProjectId || 1;
        // 将 base64 转为 File 上传
        const base64Data = displayImageUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const file = new File([bytes], 'input.png', { type: 'image/png' });
        // 使用临时路径上传
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const ossKey = `temp/${projectId}/${timestamp}_${random}.png`;
        const { default: OSS } = await import('ali-oss');
        const { default: apiClient } = await import('@/api/client');
        const stsResponse = await apiClient.get('/oss/sts-credentials');
        const credentials = stsResponse.data.data;
        const client = new OSS({
          bucket: 'huanu',
          endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
          accessKeyId: credentials.accessKeyId,
          accessKeySecret: credentials.accessKeySecret,
          stsToken: credentials.securityToken,
        });
        const result = await client.put(ossKey, file);
        imageURL = result.url;
      }
      
      console.log('[ImageNode] 生成图片, imageURL:', imageURL);

      // 调用生成 API（与 PromptNode 相同），传递 imageURL
      const result = await generateImage(data.prompt, {
        aspectRatio: data.aspectRatio || '1:1',
        resolution: data.resolution || '1K',
      }, imageURL);

      console.log('[ImageNode] 生成成功:', result);

      // 创建新 ImageNode（新节点在当前节点右侧 350px）
      const { nodes, addNode, addConnection } = useCanvasStore.getState();
      const currentNode = nodes.find(n => n.id === nodeId);
      
      if (currentNode) {
        const newNodeX = currentNode.position.x + 350;
        const newNodeY = currentNode.position.y;
        
        const newImageNodeId = `image-${Date.now()}`;
        addNode('imageNode', { x: newNodeX, y: newNodeY }, {
          data: {
            imageUrl: result.imageUrl,
            assetId: result.imageId,
            label: '生成结果',
            processInfo: '生成',
            ext2: JSON.stringify([{
              type: '生成',
              prompt: data.prompt,
              timestamp: Date.now()
            }])
          }
        });
        
        // 创建连线
        addConnection(nodeId, newImageNodeId, 'default');
        
        // 记录流程线：检查上游是否有资产
        const inputAssetId = getInputAssetId(nodeId);
        if (inputAssetId) {
          console.log('[ImageNode] 上游有资产，记录流程线:', inputAssetId);
          await appendToAssetChain(inputAssetId, {
            type: '生成',
            targetId: result.imageId,
            prompt: data.prompt,
            timestamp: Date.now()
          });
        } else {
          console.log('[ImageNode] 上游无资产，不需要记录流程线');
        }
      }

    } catch (err) {
      console.error('[ImageNode] 生成失败:', err);
      updateData('status', 'failed');
      updateData('error', err instanceof Error ? err.message : '生成失败');
    }
  };

  const handleSaveToAsset = async () => {
    const imageToSave = retryInfo?.imageUrl || displayImageUrl;
    if (!imageToSave) return;

    updateData('status', 'processing');

    try {
      const projectStorage = localStorage.getItem('project-storage');
      const projectId = projectStorage ? JSON.parse(projectStorage).state?.currentProjectId : 1;

      const newImage = await imageApi.create({
        resourceName: `${data.label || '图片'}-保存`,
        resourceType: 'image',
        resourceContent: imageToSave,
        projectId,
      });

      if (newImage && newImage.id) {
        updateData('assetId', newImage.id);
        updateData('imageUrl', newImage.id.toString());
        updateData('status', 'completed');
        updateData('processInfo', '已保存');
        updateData('retryInfo', null);
      }
    } catch (err) {
      console.error('[ImageNode] 保存失败:', err);
      updateData('status', 'failed');
    }
  };

  const handleUpscale = async () => {
    if (MOCK_MODE) {
      await upscaleMock();
    } else {
      await upscaleWithRunningHub();
    }
  };

  // ========== Mouse Handlers ==========
  const isDraggingRef = useRef(false);

  const handleImageMouseDown = () => {
    isDraggingRef.current = false;
  };

  const handleImageMouseMove = () => {
    isDraggingRef.current = true;
  };

  const handleImageClick = () => {
    if (!isDraggingRef.current && !isProcessing) {
      triggerUpload();
    }
  };

  // ========== Render ==========
  return (
    <div className="relative w-full h-full min-w-[280px] min-h-[200px] -m-3">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* 图片预览 */}
      <ImagePreview
        displayImageUrl={displayImageUrl}
        isProcessing={isProcessing}
        onUpload={triggerUpload}
        onMouseDown={handleImageMouseDown}
        onMouseMove={handleImageMouseMove}
        onClick={handleImageClick}
      />

      {/* 处理信息 */}
      <ProcessInfo
        processInfo={data.processInfo}
        isProcessing={isProcessing}
        status={data.status}
        onRetry={handleSaveToAsset}
      />

      {/* 生成标签 - 左下角 */}
      {(() => {
        const ext2 = data.ex2 || data.ext2;
        if (!ext2) return null;
        
        let processChain: Array<{ type: string; prompt?: string; timestamp: number }> = [];
        try {
          processChain = JSON.parse(ext2);
        } catch {
          return null;
        }
        
        const generationInfo = processChain.find((item: { type: string }) => item.type === '生成');
        if (!generationInfo) return null;
        
        return (
          <div className="absolute bottom-2 left-2 z-10 group">
            <div className="bg-pink-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">
              生成
            </div>
            {/* 悬浮显示 prompt */}
            {generationInfo.prompt && (
              <div className="absolute bottom-full left-0 mb-1 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity max-w-[200px] truncate">
                {generationInfo.prompt}
              </div>
            )}
          </div>
        );
      })()}

      {/* 处理链图片 */}
      {processChainImages.length > 0 && (
        <div className="absolute bottom-2 right-2 z-10 flex gap-1">
          {processChainImages.map((item, idx) => (
            <div key={idx} className="relative group">
              <img 
                src={item.url} 
                alt={item.type}
                className="w-10 h-10 object-cover rounded border border-gray-600" 
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 rounded px-1 py-0.5 text-[8px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {item.type}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 失败状态 */}
      {data.status === 'failed' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">
          生成失败
        </div>
      )}

      {/* 工具栏 - 显示在上方 */}
      {selected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
          <ImageToolbar
            isProcessing={isProcessing}
            hasImage={hasImage}
            isUpscaling={isUpscaling}
            showSettings={showSettings}
            activeTool={activeTool}
            onGenerate={() => {
              setShowSettings(!showSettings);
              setActiveTool(showSettings ? null : 'generate');
            }}
            onUpscale={() => {
              handleUpscale().catch(err => {
                console.error('[ImageNode] 放大失败:', err);
              });
              setActiveTool('upscale');
              setShowSettings(false);
            }}
            onRemoveWatermark={() => {
              console.log('去水印');
              setActiveTool('removeWatermark');
              setShowSettings(false);
            }}
            onDownload={() => {
              handleDownload();
              setActiveTool('download');
              setShowSettings(false);
            }}
            onMultiAngle={() => {
              console.log('多角度');
              setActiveTool('multiAngle');
              setShowSettings(false);
            }}
            onLighting={() => {
              console.log('打光');
              setActiveTool('lighting');
              setShowSettings(false);
            }}
            onToggleSettings={() => {
              setShowSettings(!showSettings);
              setActiveTool(showSettings ? null : 'generate');
            }}
          />
        </div>
      )}

      {/* 生成设置 - 紧挨着图片下方 */}
      {selected && showSettings && (
        <div className="absolute -bottom-1 left-0 right-0 z-10">
          <GenerationSettings
            prompt={data.prompt || ''}
            aspectRatio={data.aspectRatio || '1:1'}
            resolution={data.resolution || '1K'}
            isProcessing={isProcessing}
            onPromptChange={(v) => updateData('prompt', v)}
            onAspectRatioChange={(v) => updateData('aspectRatio', v)}
            onResolutionChange={(v) => updateData('resolution', v)}
            onGenerate={() => {
              setShowSettings(false);
              handleGenerate();
            }}
          />
        </div>
      )}
    </div>
  );
}
