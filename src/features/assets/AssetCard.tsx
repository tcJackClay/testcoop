import { useState, useEffect, useMemo } from 'react';
import { Star, User, Mountain, MapPin, Gem, Package, Image as ImageIcon, Video } from 'lucide-react';
import type { AssetWithVariants, AssetCategory } from '../../types/asset';
import type { Image } from '../../api/image';
import { imageApi } from '../../api/image';


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

// 从 ext1 推断 category 类型
const inferCategory = (ext1: string | undefined): AssetCategory => {
  if (ext1) {
    try {
      const ext1Data = JSON.parse(ext1);
      if (ext1Data.parent) {
        const parentName = ext1Data.parent;
        if (parentName.includes('角色')) return '次要角色';
        if (parentName.includes('场景')) return '次要场景';
        if (parentName.includes('道具')) return '次要道具';
      }
      if (ext1Data.type) {
        const type = ext1Data.type.toLowerCase();
        if (type.includes('character') && type.includes('primary')) return '主要角色';
        if (type.includes('character') && type.includes('secondary')) return '次要角色';
        if (type.includes('scene') && type.includes('primary')) return '主要场景';
        if (type.includes('scene') && type.includes('secondary')) return '次要场景';
        if (type.includes('prop') && type.includes('primary')) return '主要道具';
        if (type.includes('prop') && type.includes('secondary')) return '次要道具';
      }
    } catch {}
  }
  return '次要道具';
};

// 从 ext1 获取变体数量
const getVariantCount = (ext1: string | undefined): number => {
  if (ext1) {
    try {
      const ext1Data = JSON.parse(ext1);
      if (ext1Data.variants && Array.isArray(ext1Data.variants)) {
        return ext1Data.variants.length;
      }
    } catch {}
  }
  return 0;
};

// 从 ext1 判断是否变体
const isVariant = (ext1: string | undefined): boolean => {
  if (ext1) {
    try {
      const ext1Data = JSON.parse(ext1);
      return !!ext1Data.parent;
    } catch {}
  }
  return false;
};

// 获取直接可用的图片 URL
const getDirectUrl = (resourceContent: string | undefined): string | undefined => {
  if (!resourceContent) return undefined;
  if (resourceContent.startsWith('http://') || resourceContent.startsWith('https://') ||
      resourceContent.startsWith('data:') || resourceContent.startsWith('blob:')) {
    return resourceContent;
  }
  return undefined;
};

// 从 API 获取图片 URL
const fetchImageUrl = async (imageId: number): Promise<string | null> => {
  try {
    return await imageApi.getDisplayUrl(imageId);
  } catch (error) {
    console.error('获取图片失败:', error);
    return null;
  }
};

export default function AssetCard({ 
  asset, 
  onDragStart, 
  onDragEnd, 
  onContextMenu,
  onClick 
}: AssetCardProps) {
  // 通过 API 获取完整资产信息
  const [fullAsset, setFullAsset] = useState<Image | null>(null);

  // 优先使用 API 获取的数据，否则使用 props 传入的数据
  // 统一使用 Image 类型
  const data = fullAsset || asset as Image;
  
  // 解析 ext1 相关数据
  const ext1 = data.ext1;
  const category = useMemo(() => inferCategory(ext1), [ext1]);
  const variantCount = useMemo(() => getVariantCount(ext1), [ext1]);
  const isVar = useMemo(() => isVariant(ext1), [ext1]);
  
  // 图片 URL 处理
  const directUrl = getDirectUrl(data.resourceContent);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // 加载完整资产信息
  useEffect(() => {
    const loadAssetData = async () => {
      if (asset.id && !fullAsset) {
        try {
          const assetData = await imageApi.getById(Number(asset.id));
          if (assetData) {
            setFullAsset(assetData);
          }
        } catch (error) {
          console.error('获取资产详情失败:', error);
        }
      }
    };
    loadAssetData();
  }, [asset.id, fullAsset]);

  // 加载图片
  useEffect(() => {
    const loadImage = async () => {
      if (asset.id && !directUrl && !imageUrl) {
        const url = await fetchImageUrl(Number(asset.id));
        if (url) setImageUrl(url);
      }
    };
    loadImage();
  }, [asset.id, directUrl, imageUrl]);

  const displayImageUrl = imageUrl || directUrl;
  const hasImage = !!displayImageUrl && displayImageUrl.length > 0;

  // 获取名称和描述
  const assetName = data.name || data.resourceName;
  // 尝试从 ext2 获取描述
  const description = useMemo(() => {
    if (data.ext2) {
      try {
        const ext2Data = JSON.parse(data.ext2);
        return ext2Data.description;
      } catch {}
    }
    return '';
  }, [data.ext2]);

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
            alt={assetName} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={24} className="text-gray-600" />
          </div>
        )}

        {/* Category Badge */}
        <div className={`absolute top-2 left-2 p-1 rounded text-white ${categoryColors[category]}`}>
          {categoryIcons[category]}
        </div>
        
        {/* Variant Badge */}
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
      <div className="px-1 text-center">
        <p className="text-[10px] font-medium text-gray-300 truncate">{assetName}</p>
        {description && (
          <p className="text-[8px] text-gray-500 truncate">{description}</p>
        )}
      </div>
    </div>
  );
}
