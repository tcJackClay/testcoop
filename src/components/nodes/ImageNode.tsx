// ImageNode - AI绘图节点组件
import { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, Download, Loader2, Maximize2, Eraser } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { aspectRatioOptions, resolutionOptions } from './nodeConstants';
import { apiClient } from '../../api/client';

interface ImageNodeProps {
  nodeId: string;
  data: {
    imageUrl?: string;
    assetId?: number;
    prompt?: string;
    status?: string;
    aspectRatio?: string;
    resolution?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);
  
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

  const isProcessing = status === 'processing';
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
        className="absolute inset-0 flex items-center justify-center bg-gray-800 cursor-pointer overflow-hidden rounded-lg"
        onMouseDown={handleImageMouseDown}
        onMouseMove={handleImageMouseMove}
        onClick={handleImageClick}
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

      {/* 状态指示 */}
      {status === 'failed' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">
          生成失败
        </div>
      )}
      {status === 'completed' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-green-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">
          生成完成
        </div>
      )}

      {/* 智能工具栏 - 仅选中时显示，显示在节点外部 */}
      {selected && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10">
          {/* 工具栏 */}
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-lg border border-gray-700">
            {/* 上传按钮 */}
            <button
              onClick={handleImageClick}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              title="上传图片"
            >
              <Upload className="w-3 h-3" />
            </button>

            <div className="w-px h-3 bg-gray-600" />

            {/* 生成按钮 */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors ${
                showSettings ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>生成</span>
            </button>

            <div className="w-px h-3 bg-gray-600" />

            {/* 高清放大按钮 */}
            <button
              onClick={() => console.log('高清放大')}
              disabled={!hasImage}
              className={`p-1 rounded-full transition-colors ${
                hasImage ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 cursor-not-allowed'
              }`}
              title="高清放大"
            >
              <Maximize2 className="w-3 h-3" />
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
