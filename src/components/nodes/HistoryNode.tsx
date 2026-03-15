// HistoryNode - 生成历史节点组件
// 显示资产的完整处理历史，包括原始图片和所有生成的图片
import { useState, useEffect, useRef } from 'react';
import { History, Image, ChevronRight, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface ProcessRecord {
  type: string;        // 处理类型: '高清放大', '去水印' 等
  timestamp: number;   // 处理时间
}

interface HistoryNodeProps {
  nodeId: string;
  data: {
    assetId?: number;
    originalImageUrl?: string;  // 原始图片 URL (base64)
    originalImagePath?: string; // 原始图片路径
    processChain?: ProcessRecord[];  // 处理记录列表
    processImageIds?: number[]; // 处理后图片的 assetId 列表
  };
  updateData: (key: string, value: unknown) => void;
  selected?: boolean;
}

export default function HistoryNode({ nodeId, data, updateData, selected = false }: HistoryNodeProps) {
  const [images, setImages] = useState<Array<{ id?: number; url: string; type: string; timestamp: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  
  const assetId = data.assetId;
  const originalImageUrl = data.originalImageUrl;
  const originalImagePath = data.originalImagePath;
  const processChain = data.processChain || [];
  const processImageIds = data.processImageIds || [];

  // 加载所有图片
  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      const loadedImages: Array<{ id?: number; url: string; type: string; timestamp: number }> = [];
      
      // 1. 添加原始图片
      if (originalImageUrl) {
        loadedImages.push({
          url: originalImageUrl,
          type: '原始图片',
          timestamp: 0
        });
      } else if (originalImagePath && assetId) {
        // 从后端获取原始图片
        try {
          const response = await apiClient.get(`/image/${assetId}`);
          if (response.data?.code === 0 && response.data?.data) {
            let base64 = response.data.data;
            if (!base64.startsWith('data:')) {
              base64 = `data:image/png;base64,${base64}`;
            }
            loadedImages.push({
              id: assetId,
              url: base64,
              type: '原始图片',
              timestamp: 0
            });
          }
        } catch (err) {
          console.error('[HistoryNode] 获取原始图片失败:', err);
        }
      }
      
      // 2. 添加处理后的图片
      for (const processRecord of processChain) {
        // 尝试从 processChain 中获取 targetId 或 targetPath
        const targetId = (processRecord as any).targetId;
        
        if (targetId) {
          try {
            const response = await apiClient.get(`/image/${targetId}`);
            if (response.data?.code === 0 && response.data?.data) {
              let base64 = response.data.data;
              if (!base64.startsWith('data:')) {
                base64 = `data:image/png;base64,${base64}`;
              }
              loadedImages.push({
                id: targetId,
                url: base64,
                type: processRecord.type,
                timestamp: processRecord.timestamp
              });
            }
          } catch (err) {
            console.error('[HistoryNode] 获取处理图片失败:', err, targetId);
          }
        }
      }
      
      setImages(loadedImages);
      setLoading(false);
    };
    
    if (assetId || originalImageUrl || processChain.length > 0) {
      loadImages();
    }
  }, [assetId, originalImageUrl, originalImagePath, processChain]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return '原始';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative w-full min-w-[320px] -m-3">
      {/* 头部 - 标题 */}
      <div className="bg-gradient-to-r from-pink-600/80 to-purple-600/80 px-3 py-2 rounded-t-lg flex items-center gap-2">
        <History className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white">生成历史</span>
        <span className="text-xs text-white/60 ml-auto">{images.length} 张图片</span>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
        </div>
      )}

      {/* 内容区域 */}
      <div className="bg-gray-800 p-3 rounded-b-lg">
        {/* 时间线展示 */}
        <div className="space-y-2">
          {images.map((img, index) => (
            <div 
              key={index}
              className={`relative flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                selectedImageIndex === index ? 'bg-pink-500/30 border border-pink-500/50' : 'bg-gray-700/50 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              {/* 时间线连接线 */}
              {index < images.length - 1 && (
                <div className="absolute left-[27px] top-10 w-0.5 h-4 bg-gray-600" />
              )}
              
              {/* 图片缩略图 */}
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-600">
                <img src={img.url} alt={img.type} className="w-full h-full object-cover" />
              </div>
              
              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white truncate">{img.type}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400">{formatTime(img.timestamp)}</span>
                </div>
                {img.id && <span className="text-[10px] text-gray-500">ID: {img.id}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {!loading && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Image className="w-8 h-8 mb-2" />
            <span className="text-xs">暂无生成历史</span>
          </div>
        )}

        {/* 预览区域 - 选中图片时显示大图 */}
        {selectedImageIndex >= 0 && images[selectedImageIndex] && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="relative rounded-lg overflow-hidden bg-gray-900">
              <img 
                src={images[selectedImageIndex].url} 
                alt={images[selectedImageIndex].type}
                className="w-full h-auto max-h-48 object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                <span className="text-xs text-white">{images[selectedImageIndex].type}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
