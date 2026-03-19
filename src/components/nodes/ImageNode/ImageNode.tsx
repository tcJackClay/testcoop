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
      const generateFunc = DEFAULT_FUNCTIONS.find(f => f.id === 'ai_image_generate');
      if (!generateFunc) {
        throw new Error('未找到图片生成功能');
      }

      const { nodeInfoList } = await runningHubApi.getNodeInfo(generateFunc.webappId!);

      const taskResult = await runningHubApi.submitTaskDirect(generateFunc.webappId!, [
        {
          nodeId: nodeInfoList[0].nodeId,
          fieldName: nodeInfoList[0].fieldName,
          fieldValue: JSON.stringify({
            prompt: data.prompt,
            aspect_ratio: data.aspectRatio || '1:1',
            resolution: data.resolution || '1K',
          })
        }
      ]);

      if (!taskResult.success) {
        throw new Error('任务提交失败');
      }

      // 轮询获取结果...
      const pollTask = async () => {
        const result = await runningHubApi.queryTaskDirect(taskResult.taskId!);
        
        if (result.status === 'success' && result.imageUrl) {
          updateData('imageUrl', result.imageUrl);
          updateData('status', 'completed');
        } else if (result.status === 'failed') {
          updateData('status', 'failed');
          updateData('error', result.error || '生成失败');
        } else {
          setTimeout(pollTask, 2000);
        }
      };

      pollTask();
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
