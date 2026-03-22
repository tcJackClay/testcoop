import { useState, useEffect } from 'react';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import type { Image } from '../../api/image';
import { apiClient } from '../../api/client';

// 从 API 获取 base64 图片数据
const fetchImageBase64 = async (imageId: number): Promise<string | null> => {
  try {
    const response = await apiClient.get(`/image/${imageId}`);
    const res = response.data;
    if (res.code === 0 && res.data) {
      return res.data;
    }
  } catch (error) {
    console.error('获取图片失败:', error);
  }
  return null;
};

// 图片组件 - 自动获取 base64
function VariantImage({ imageId, src, alt }: { imageId?: number; src?: string; alt?: string }) {
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchImage = async () => {
      // 优先使用 src，如果是相对路径则获取 base64
      if (imageId && !src?.startsWith('data:') && !src?.startsWith('http')) {
        const base64 = await fetchImageBase64(imageId);
        if (base64) {
          let dataUrl = base64;
          if (!base64.startsWith('data:')) {
            dataUrl = `data:image/png;base64,${base64}`;
          }
          setBase64Image(dataUrl);
        }
      }
    };
    fetchImage();
  }, [imageId, src]);
  
  const displaySrc = base64Image || src;
  
  if (!displaySrc) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon size={32} className="text-gray-500" />
      </div>
    );
  }
  
  return (
    <img
      src={displaySrc}
      alt={alt}
      className="w-full h-full object-cover"
    />
  );
}

interface VariantDetailViewProps {
  selectedPrimaryAsset: Image;
  variants: Image[];
  onBack: () => void;
}

export default function VariantDetailView({ selectedPrimaryAsset, variants, onBack }: VariantDetailViewProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Back button and title */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 rounded hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft size={14} />
          <span>返回资产库</span>
        </button>
      </div>

      {/* Primary asset display */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-white mb-2">
          {selectedPrimaryAsset.name || selectedPrimaryAsset.resourceName}
        </h3>
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
          <VariantImage 
            imageId={selectedPrimaryAsset.id}
            src={selectedPrimaryAsset.resourceContent}
            alt={selectedPrimaryAsset.name || selectedPrimaryAsset.resourceName}
          />
        </div>
      </div>

      {/* Variants section */}
      {variants.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-[10px] text-gray-400 mb-2">变体 ({variants.length})</h4>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((variant) => (
              <div key={variant.id ?? variant.resourceName ?? Math.random()} className="flex flex-col gap-1">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
                  <VariantImage 
                    imageId={variant.id}
                    src={variant.resourceContent}
                    alt={variant.name || variant.resourceName}
                  />
                </div>
                <span className="text-[10px] text-gray-400 text-center truncate">
                  {variant.name || variant.resourceName || '变体'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
