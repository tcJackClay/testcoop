// ImageNode - AI绘图节点组件
import { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, Download, Loader2, Maximize2, Eraser } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { aspectRatioOptions, resolutionOptions } from './nodeConstants';
import { apiClient } from '../../api/client';
import { imageApi } from '../../api/image';
import { vectorApi } from '../../api/vector';
import { runningHubApi, DEFAULT_FUNCTIONS } from '../../api/runningHub';

interface ImageNodeProps {
  nodeId: string;
  data: {
    imageUrl?: string;
    assetId?: number;
    prompt?: string;
    status?: string;
    aspectRatio?: string;
    resolution?: string;
    processInfo?: string;
    processFrom?: string; // 记录由哪个节点处理产生
    processChain?: Array<{type: string; targetId: number; targetPath: string; timestamp: number}>;
    ex2?: string;
  };
  updateData: (key: string, value: unknown) => void;
  selected?: boolean;
}

export default function ImageNode({ nodeId, data, updateData, selected = false }: ImageNodeProps) {
  const imageUrl = data.imageUrl as string || '';
  const assetId = data.assetId as number | undefined;
  const prompt = data.prompt as string || '';
  const status = data.status as string || 'idle';
  const aspectRatio = data.aspectRatio as string || '1:1';
  const resolution = data.resolution as string || '1K';
  
  const [displayImageUrl, setDisplayImageUrl] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [processChainImages, setProcessChainImages] = useState<Array<{type: string; url: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);
  
  // 解析处理链
  const processChain = data.processChain || (data.ex2 ? JSON.parse(data.ex2) : []) as Array<{type: string; targetId: number; targetPath: string; timestamp: number}>;
  
  // 获取处理链图片
  useEffect(() => {
    const fetchProcessChainImages = async () => {
      if (processChain && processChain.length > 0) {
        const images: Array<{type: string; url: string}> = [];
        for (const item of processChain) {
          if (item.targetId) {
            try {
              const response = await apiClient.get(`/image/${item.targetId}`);
              const res = response.data;
              if (res.code === 0 && res.data) {
                let base64 = res.data;
                if (!base64.startsWith('data:')) {
                  base64 = `data:image/png;base64,${base64}`;
                }
                images.push({ type: item.type, url: base64 });
              }
            } catch (err) {
              console.error('[ImageNode] 获取处理链图片失败:', err);
            }
          }
        }
        setProcessChainImages(images);
      }
    };
    fetchProcessChainImages();
  }, [processChain]);
  
  // 如果有 assetId，获取 base64 数据
  useEffect(() => {
    const fetchBase64 = async () => {
      if (assetId) {
        try {
          const response = await apiClient.get(`/image/${assetId}`);
          const res = response.data;
          if (res.code === 0 && res.data) {
            let base64 = res.data;
            if (!base64.startsWith('data:')) {
              base64 = `data:image/png;base64,${base64}`;
            }
            setDisplayImageUrl(base64);
          }
        } catch (err) {
          console.error('获取图片失败:', err);
        }
      } else if (imageUrl) {
        setDisplayImageUrl(imageUrl);
      }
    };
    fetchBase64();
  }, [assetId, imageUrl]);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateData('imageUrl', url);
      updateData('assetId', undefined);
    }
  };

  // 生成图片
  const handleGenerate = () => {
    if (status !== 'processing') {
      const store = useCanvasStore.getState();
      if (store.executeNode) {
        store.executeNode(nodeId);
      }
    }
  };

  // 下载图片
  const handleDownload = () => {
    if (!displayImageUrl) return;
    const link = document.createElement('a');
    link.href = displayImageUrl;
    link.download = `image-${nodeId}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 重新保存资产（用于上传失败后的重试）
  const handleSaveToAsset = async () => {
    if (!displayImageUrl || isUpscaling) return;
    
    setIsUpscaling(true);
    updateData('status', 'processing');
    
    try {
      // 从当前图片 URL 下载并保存
      const imgResponse = await fetch(displayImageUrl);
      const imgBlob = await imgResponse.blob();
      const imgFile = new File([imgBlob], `upscale-${Date.now()}.png`, { type: 'image/png' });
      
      // 上传到后端
      const uploadResult = await vectorApi.uploadImageFile(imgFile);
      
      if (uploadResult.code === 0 && uploadResult.data) {
        const localPath = uploadResult.data.localPath || uploadResult.data.imageUrl || '';
        
        // 保存到资产库
        const projectStorage = localStorage.getItem('project-storage');
        const projectId = projectStorage ? JSON.parse(projectStorage).state?.currentProjectId : 1;
        
        // 找到上游节点
        const canvasStore = useCanvasStore.getState();
        const connections = canvasStore.connections || [];
        const incomingConnection = connections.find((c: any) => c.targetId === nodeId);
        const sourceNodeId = incomingConnection?.sourceId;
        const sourceNode = sourceNodeId ? canvasStore.nodes.find((n: any) => n.id === sourceNodeId) : null;
        
        // 新资产的 ext2
        const sourceEx2 = sourceNode?.data?.ex2 ? JSON.parse(sourceNode.data.ex2 as string) : [];
        const newAssetEx2 = [...sourceEx2, { type: '高清放大', sourceId: sourceNodeId, timestamp: Date.now() }];
        
        const newImage = await imageApi.create({
          resourceName: `${data.label || '图片'}-高清放大`,
          resourceType: 'image',
          resourceContent: localPath,
          projectId: projectId,
          ext2: JSON.stringify(newAssetEx2),
        });
        
        if (newImage && newImage.id) {
          console.log('[ImageNode] 重新保存成功, id:', newImage.id);
          
          // 更新上游节点 ex2
          if (sourceNode && sourceNode.data) {
            const existingEx2 = sourceNode.data.ex2 ? JSON.parse(sourceNode.data.ex2 as string) : [];
            const updatedEx2 = [...existingEx2, { targetId: newImage.id, targetPath: localPath, timestamp: Date.now() }];
            
            canvasStore.updateNode(sourceNodeId, {
              data: { ...sourceNode.data, ex2: JSON.stringify(updatedEx2) }
            });
            
            if (sourceNode.data.assetId) {
              await imageApi.update(sourceNode.data.assetId, { ext2: JSON.stringify(updatedEx2) });
            }
          }
          
          updateData('status', 'completed');
          updateData('processInfo', '高清放大');
          console.log('[ImageNode] 重试保存成功');
        }
      } else {
        throw new Error(uploadResult.message || '上传失败');
      }
    } catch (err) {
      console.error('[ImageNode] 重试保存失败:', err);
      updateData('status', 'upload_failed');
    } finally {
      setIsUpscaling(false);
    }
  };
  
  // 高清放大 - 前端上传图片，RunningHub提交任务
  const handleUpscale = async () => {
    if (!displayImageUrl || isUpscaling) return;
    
    console.log('[ImageNode] ========== 开始高清放大 ==========');
    setIsUpscaling(true);
    updateData('status', 'processing');
    
    try {
      // 1. 获取当前图片
      console.log('[ImageNode] 1. 获取当前图片');
      const response = await fetch(displayImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `upscale-${Date.now()}.png`, { type: 'image/png' });
      console.log('[ImageNode] 图片获取成功, 大小:', blob.size);
      
      // 2. 获取 RunningHub 配置
      console.log('[ImageNode] 2. 获取 RunningHub 配置');
      const upscaleFunc = DEFAULT_FUNCTIONS.find(f => f.id === 'ai_image_upscale');
      if (!upscaleFunc) {
        throw new Error('未找到图片放大功能');
      }
      console.log('[ImageNode] 功能配置:', upscaleFunc);
      
      // 3. 获取节点信息
      console.log('[ImageNode] 3. 获取节点信息');
      const { nodeInfoList } = await runningHubApi.getNodeInfo(upscaleFunc.webappId!);
      console.log('[ImageNode] 节点信息:', nodeInfoList);
      
      // 4. 上传图片到 RunningHub
      console.log('[ImageNode] 4. 上传图片到 RunningHub');
      const uploadResult = await runningHubApi.uploadFileDirect(file);
      if (!uploadResult.success || !uploadResult.fileName) {
        throw new Error(uploadResult.error || '图片上传失败');
      }
      console.log('[ImageNode] RunningHub 图片上传成功, fileName:', uploadResult.fileName);
      
      // 使用 fileName（相对路径）提交任务
      const imageField = nodeInfoList.find((field: any) => 
        field.fieldName?.toLowerCase().includes('image') || 
        field.fieldName?.toLowerCase().includes('图片')
      );
      
      const nodeInfo = [{
        nodeId: imageField?.nodeId || '15',
        fieldName: imageField?.fieldName || 'image',
        fieldValue: uploadResult.fileName,
        description: imageField?.description || '',
      }];
      
      console.log('[ImageNode] 5. 提交任务到 RunningHub');
      // 提交任务
      const taskResult = await runningHubApi.submitTaskDirect(upscaleFunc.webappId!, nodeInfo);
      if (!taskResult.success || !taskResult.taskId) {
        throw new Error(taskResult.error || '任务提交失败');
      }
      
      const taskId = taskResult.taskId;
      console.log('[ImageNode] RunningHub 任务提交成功, taskId:', taskId);
      
      // 6. 轮询查询任务状态
      console.log('[ImageNode] 6. 开始轮询查询任务状态');
      const pollTask = async (): Promise<void> => {
        try {
          const queryResult = await runningHubApi.queryTaskDirect(taskId);
          
          if (!queryResult.success) {
            throw new Error(queryResult.error || '查询任务失败');
          }
          
          const status = queryResult.status;
          console.log('[ImageNode] 任务状态:', status);
          
          if (status === 'success' && queryResult.imageUrl) {
            const resultImage = queryResult.imageUrl;
            console.log('[ImageNode] 7. 任务成功，获取结果图片:', resultImage);
            
            // 8. 保存处理后的图片
            console.log('[ImageNode] 8. 开始保存到资产库');
            let newImageId: number | null = null;
            let localPath = '';
            let uploadSuccess = false;
            
            try {
              console.log('[ImageNode] 8.1 下载结果图片');
              const imgResponse = await fetch(resultImage);
              const imgBlob = await imgResponse.blob();
              console.log('[ImageNode] 8.2 图片下载成功, 大小:', imgBlob.size);
              
              const imgFile = new File([imgBlob], `upscale-${Date.now()}.png`, { type: 'image/png' });
              
              // 8.3 上传到后端
              console.log('[ImageNode] 8.3 上传到后端图床');
              try {
                const uploadResult = await vectorApi.uploadImageFile(imgFile);
                console.log('[ImageNode] 8.3.1 上传响应:', uploadResult);
                
                if (uploadResult.code === 0 && uploadResult.data) {
                  localPath = uploadResult.data.localPath || uploadResult.data.imageUrl || '';
                  console.log('[ImageNode] 8.4 图床上传成功, localPath:', localPath);
                
                // 9. 保存到资产库
                console.log('[ImageNode] 9. 保存到资产库');
                const projectStorage = localStorage.getItem('project-storage');
                const projectId = projectStorage ? JSON.parse(projectStorage).state?.currentProjectId : 1;
                
                // 找到上游节点
                const canvasStore = useCanvasStore.getState();
                const connections = canvasStore.connections || [];
                const incomingConnection = connections.find((c: any) => c.targetId === nodeId);
                const sourceNodeId = incomingConnection?.sourceId;
                const sourceNode = sourceNodeId ? canvasStore.nodes.find((n: any) => n.id === sourceNodeId) : null;
                
                // 新资产的 ext2：记录处理来源
                const sourceEx2 = sourceNode?.data?.ex2 ? JSON.parse(sourceNode.data.ex2 as string) : [];
                const newAssetEx2 = [
                  ...sourceEx2,
                  { type: '高清放大', sourceId: sourceNodeId, timestamp: Date.now() }
                ];
                
                console.log('[ImageNode] 9.1 创建资产, ext2:', newAssetEx2);
                const newImage = await imageApi.create({
                  resourceName: `${data.label || '图片'}-高清放大`,
                  resourceType: 'image',
                  resourceContent: localPath,
                  projectId: projectId,
                  ext2: JSON.stringify(newAssetEx2),
                });
                
                console.log('[ImageNode] 保存到资产库响应:', newImage);
                
                if (newImage && newImage.id) {
                  newImageId = newImage.id;
                  uploadSuccess = true;
                  console.log('[ImageNode] 图片保存到资产库成功, id:', newImageId, 'ext2:', newAssetEx2);
                  
                  // 更新上游节点的 ex2
                  if (sourceNode && sourceNode.data) {
                    const existingEx2 = sourceNode.data.ex2 ? JSON.parse(sourceNode.data.ex2 as string) : [];
                    const updatedEx2 = [...existingEx2, { targetId: newImageId, targetPath: localPath, timestamp: Date.now() }];
                    
                    canvasStore.updateNode(sourceNodeId, {
                      data: { ...sourceNode.data, ex2: JSON.stringify(updatedEx2) }
                    });
                    
                    // 同步到后端
                    if (sourceNode.data.assetId) {
                      await imageApi.update(sourceNode.data.assetId, { ext2: JSON.stringify(updatedEx2) });
                      console.log('[ImageNode] 上游资产 ext2 同步成功');
                    }
                  }
                }
              }
            } catch (err) {
              console.error('[ImageNode] 8.3 上传图片失败:', err);
            }
            
            // 更新当前节点状态
            if (uploadSuccess) {
              updateData('status', 'completed');
              updateData('processInfo', '高清放大');
              console.log('[ImageNode] ========== 高清放大完成 ==========');
            } else {
              updateData('status', 'upload_failed');
              updateData('processInfo', '高清放大(未保存)');
            }
            
            // 创建新节点显示结果
            const canvasStore = useCanvasStore.getState();
            const currentNode = canvasStore.nodes.find(n => n.id === nodeId);
            const currentPos = currentNode?.position || { x: 0, y: 0 };
            
            canvasStore.addNode('imageNode', { x: currentPos.x + 350, y: currentPos.y }, {
              data: {
                imageUrl: resultImage,
                label: `${data.label || '图片'}-放大`,
                status: 'completed',
                processInfo: '高清放大',
                processFrom: nodeId,
              }
            });
            
          } else if (status === 'failed') {
            updateData('status', 'failed');
            updateData('error', '任务执行失败');
          } else {
            setTimeout(pollTask, 2000);
          }
        } catch (err) {
          console.error('[ImageNode] 查询任务失败:', err);
          updateData('status', 'failed');
          updateData('error', err instanceof Error ? err.message : '查询失败');
        }
      };
      
      // 开始轮询
      pollTask();
      
    } catch (err) {
      console.error('高清放大失败:', err);
      updateData('status', 'failed');
      updateData('error', err instanceof Error ? err.message : '高清放大失败');
    } finally {
      setIsUpscaling(false);
    }
  };

  // 区分点击和拖动
  const handleImageMouseDown = () => {
    isDraggingRef.current = false;
  };
  
  const handleImageMouseMove = () => {
    isDraggingRef.current = true;
  };
  
  const handleImageClick = () => {
    if (isDraggingRef.current) return;
    fileInputRef.current?.click();
  };

  const isProcessing = status === 'processing' || isUpscaling;
  const hasImage = !!displayImageUrl;

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

      {/* 无边框图片区域 */}
      <div 
        className={`absolute inset-0 flex items-center justify-center bg-gray-800 overflow-hidden rounded-lg ${!isProcessing ? 'cursor-pointer' : ''}`}
        onMouseDown={handleImageMouseDown}
        onMouseMove={handleImageMouseMove}
        onClick={!isProcessing ? handleImageClick : undefined}
      >
        {hasImage ? (
          <img src={displayImageUrl} alt="Preview" className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Upload className="w-10 h-10" />
            <span className="text-xs">点击上传图片</span>
          </div>
        )}
        
        {/* 悬浮上传提示 */}
        {hasImage && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
              <Upload className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
        
        {/* 生成中遮罩 */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
              <span className="text-xs text-gray-300">生成中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 左下角处理信息 - 只在处理后的节点显示，不在原图显示 */}
      {(data.processInfo || isProcessing) && data.processInfo && (
        <div className="absolute bottom-2 left-2 z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-[9px] text-white flex items-center gap-1">
            {isProcessing ? (
              <>
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>处理中...</span>
              </>
            ) : data.status === 'upload_failed' ? (
              <>
                <span className="text-red-400">上传失败</span>
                <button 
                  onClick={handleSaveToAsset}
                  className="ml-1 text-blue-400 hover:text-blue-300 underline"
                >
                  重试
                </button>
              </>
            ) : (
              <span>{data.processInfo}</span>
            )}
          </div>
        </div>
      )}

      {/* 处理链图片显示 - 右下角 */}
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

      {/* 状态指示 */}
      {status === 'failed' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">
          生成失败
        </div>
      )}

      {/* 智能工具栏 - 仅选中时显示，显示在节点外部 */}
      {selected && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10">
          {/* 工具栏 */}
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-lg border border-gray-700">
            {/* 上传按钮 - 处理中禁用 */}
            <button
              onClick={handleImageClick}
              disabled={isProcessing}
              className={`p-1 rounded-full transition-colors ${isProcessing ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              title="上传图片"
            >
              <Upload className="w-3 h-3" />
            </button>

            <div className="w-px h-3 bg-gray-600" />

            {/* 生成按钮 - 处理中禁用 */}
            <button
              onClick={() => !isProcessing && setShowSettings(!showSettings)}
              disabled={isProcessing}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors ${isProcessing ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : showSettings ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>生成</span>
            </button>

            <div className="w-px h-3 bg-gray-600" />

            {/* 高清放大按钮 */}
            <button
              onClick={handleUpscale}
              disabled={!hasImage || isUpscaling}
              className={`p-1 rounded-full transition-colors ${
                hasImage && !isUpscaling ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 cursor-not-allowed'
              }`}
              title="高清放大"
            >
              {isUpscaling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Maximize2 className="w-3 h-3" />}
            </button>

            {/* 去水印按钮 */}
            <button
              onClick={() => console.log('去水印')}
              disabled={!hasImage}
              className={`p-1 rounded-full transition-colors ${
                hasImage ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 cursor-not-allowed'
              }`}
              title="去水印"
            >
              <Eraser className="w-3 h-3" />
            </button>

            <div className="w-px h-3 bg-gray-600" />

            {/* 下载按钮 */}
            <button
              onClick={handleDownload}
              disabled={!hasImage}
              className={`p-1 rounded-full transition-colors ${
                hasImage ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 cursor-not-allowed'
              }`}
              title="下载图片"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>

          {/* 生成配置面板 - 显示在工具栏下方，不影响工具栏位置 */}
          {showSettings && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 p-1.5 bg-gray-800 rounded-lg border border-gray-700 shadow-xl w-48">
              {/* 提示词输入 */}
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-[9px] text-white resize-none mb-1"
                rows={2}
                placeholder="描述你想要生成的画面..."
                value={prompt}
                onChange={(e) => updateData('prompt', e.target.value)}
              />
              
              {/* 尺寸配置 + 生成按钮一行 */}
              <div className="flex items-center gap-1">
                <select
                  value={aspectRatio}
                  onChange={(e) => updateData('aspectRatio', e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-[9px] text-white"
                >
                  {aspectRatioOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={resolution}
                  onChange={(e) => updateData('resolution', e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-[9px] text-white"
                >
                  {resolutionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    handleGenerate();
                  }}
                  disabled={isProcessing}
                  className={`px-2 py-0.5 rounded text-[9px] font-medium flex items-center gap-0.5 ${
                    isProcessing ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-2.5 h-2.5 animate-spin" /></>
                  ) : (
                    <><Sparkles className="w-2.5 h-2.5" /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
