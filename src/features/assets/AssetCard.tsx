import { useState, useEffect } from 'react';
import { Star, User, Mountain, MapPin, Gem, Package, Image as ImageIcon, Video } from 'lucide-react';
import type { AssetWithVariants, AssetCategory } from '../../types/asset';
import type { Image } from '../../api/image';
import { apiClient } from '../../api/client';


interface AssetCardProps {
  asset: AssetWithVariants | Image;
  onDragStart: (asset: AssetWithVariants | Image) => void;
  onDragEnd: () => void;
  onContextMenu?: (asset: AssetWithVariants | Image, e: React.MouseEvent) => void;
  onAddToCanvas?: (asset: AssetWithVariants | Image) => void;
  onClick?: () => void;
}

const categoryIcons: Record<AssetCategory, React.ReactNode> = {
  '主要角色': <Star size={10} />,
  '次要角色': <User size={10} />,
  '主要场景': <Mountain size={10} />,
  '次要场景': <MapPin size={10} />,
  '主要道具': <Gem size={10} />,
  '次要道具': <Package size={10} />,
};

const categoryColors: Record<AssetCategory, string> = {
  '主要角色': 'bg-blue-500',
  '次要角色': 'bg-blue-400',
  '主要场景': 'bg-green-500',
  '次要场景': 'bg-green-400',
  '主要道具': 'bg-orange-500',
  '次要道具': 'bg-orange-400',
};

// 从 ext1 推断 category 类型（统一使用 ext1 内信息）
const inferCategory = (asset: AssetWithVariants | Image): AssetCategory => {
  // 只从 ext1 JSON 中推断
  if (asset.ext1) {
    try {
      const ext1Data = JSON.parse(asset.ext1);
      
      // 1. 检查是否是变体（有 parent 字段）
      if (ext1Data.parent) {
        const parentName = ext1Data.parent;
        if (parentName.includes('角色')) return '次要角色';
        if (parentName.includes('场景')) return '次要场景';
        if (parentName.includes('道具')) return '次要道具';
      }
      
      // 2. 检查 ext1 中是否有直接的 type 字段
      if (ext1Data.type) {
        const type = ext1Data.type.toLowerCase();
        if (type.includes('character') && type.includes('primary')) return '主要角色';
        if (type.includes('character') && type.includes('secondary')) return '次要角色';
        if (type.includes('scene') && type.includes('primary')) return '主要场景';
        if (type.includes('scene') && type.includes('secondary')) return '次要场景';
        if (type.includes('prop') && type.includes('primary')) return '主要道具';
        if (type.includes('prop') && type.includes('secondary')) return '次要道具';
      }
    } catch (e) {
      // ext1 不是有效 JSON
    }
  }
  
  // 没有 ext1 信息时返回默认分类
  return '次要道具';
};

// 获取图片 URL - 优先使用 base64 数据，否则使用 resourceContent 路径
const getImageUrl = (asset: AssetWithVariants | Image): string | undefined => {
  // 如果 resourceContent 是相对路径，需要通过 API 获取 base64
  if (asset.resourceContent && !asset.resourceContent.startsWith('data:')) {
    return undefined; // 让组件通过 API 获取
  }
  // 直接返回 base64 或完整 URL
  return asset.resourceContent;
};

// 从 API 获取 base64 图片数据
const fetchImageBase64 = async (imageId: number): Promise<string | null> => {
  try {
    const response = await apiClient.get(`/image/${imageId}`);
    const res = response.data;
    if (res.code === 0 && res.data) {
      // 假设返回的是 base64 字符串
      return res.data;
    }
  } catch (error) {
    console.error('获取图片失败:', error);
  }
  return null;
};

export default function AssetCard({ 
  asset, 
  onDragStart, 
  onDragEnd, 
  onContextMenu,
  onClick 
}: AssetCardProps) {
  const category = inferCategory(asset);
  const imageUrl = getImageUrl(asset);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 如果没有直接可用的图片URL，通过 API 获取 base64
  useEffect(() => {
    const fetchImage = async () => {
      // 有 id 且没有直接可用图片时获取，且没有正在获取
      if (asset.id && !imageUrl && !base64Image && !isLoading) {
        setIsLoading(true);
        const base64 = await fetchImageBase64(asset.id);
        if (base64) {
          // 尝试检测图片类型
          let dataUrl = base64;
          if (!base64.startsWith('data:')) {
            // 尝试检测格式（默认 png）
            dataUrl = `data:image/png;base64,${base64}`;
          }
          setBase64Image(dataUrl);
        }
        setIsLoading(false);
      }
    };
    fetchImage();
  }, [asset.id, imageUrl, base64Image]);
  
  // 优先使用 base64 图片
  const displayImageUrl = base64Image || imageUrl;
  const hasImage = !!displayImageUrl && displayImageUrl.length > 0;
  
  // Get variant count from ext1
  const getVariantCount = (): number => {
    if (asset.ext1) {
      try {
        const ext1Data = JSON.parse(asset.ext1);
        if (ext1Data.variants && Array.isArray(ext1Data.variants)) {
          return ext1Data.variants.length;
        }
      } catch {}
    }
    return 0;
  };
  
  // Check if this is a variant (has parent in ext1)
  const isVariant = (): boolean => {
    if (asset.ext1) {
      try {
        const ext1Data = JSON.parse(asset.ext1);
        return !!ext1Data.parent;
      } catch {}
    }
    return false;
  };
  
  const variantCount = getVariantCount();
  const isVar = isVariant();

  return (
    <div
      className="group flex flex-col gap-2 cursor-pointer"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(asset));
        onDragStart(asset);
      }}
      onDragEnd={onDragEnd}
      onContextMenu={(e) => onContextMenu?.(asset, e)}
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-square rounded-lg bg-gray-700 overflow-hidden relative">
        {hasImage ? (
          <img 
            src={displayImageUrl} 
            alt={asset.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={24} className="text-gray-600" />
          </div>
        )}

        {/* Category Badge - only icon */}
        <div className={`absolute top-2 left-2 p-1 rounded text-white ${categoryColors[category]}`}>
          {categoryIcons[category]}
        </div>
        
        {/* Variant Badge - only number */}
        {isVar ? (
          <div className="absolute top-2 right-2 w-5 h-5 rounded bg-purple-500 text-[8px] text-white flex items-center justify-center">
            变
          </div>
        ) : variantCount > 0 ? (
          <div className="absolute top-2 right-2 w-5 h-5 rounded bg-purple-500 text-[10px] text-white flex items-center justify-center">
            {variantCount}
          </div>
        ) : null}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {'videoUrl' in asset && asset.videoUrl && (
            <div className="p-1.5 rounded-full bg-white/20">
              <Video size={14} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-1">
        <p className="text-[10px] font-medium text-gray-300 truncate">{asset.name}</p>
        {'description' in asset && asset.description && (
          <p className="text-[8px] text-gray-500 truncate">{asset.description}</p>
        )}
      </div>
    </div>
  );
}
