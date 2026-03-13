import { Star, User, Mountain, MapPin, Gem, Package, Image as ImageIcon, Video } from 'lucide-react';
import type { AssetWithVariants, AssetCategory } from '../../types/asset';
import type { Image } from '../../api/image';


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

// 获取 imageUrl
const getImageUrl = (asset: AssetWithVariants | Image): string | undefined => {
  // 优先使用 resourceContent (API返回的实际图片URL/ base64)
  if (asset.resourceContent) return asset.resourceContent;
  // 兼容其他字段 - imageUrl 或 url
  return (asset as any).imageUrl || asset.url;
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
  
  // 检查是否有有效的图片URL
  const hasImage = !!imageUrl && imageUrl.length > 0;
  const hasVariants = 'variants' in asset && asset.variants && asset.variants.length > 0;
  // Check if this is a secondary asset (has parentId)
  const isSecondaryAsset = 'parentId' in asset && !!asset.parentId;

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
            src={imageUrl} 
            alt={asset.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={24} className="text-gray-600" />
          </div>
        )}

        {/* Category Badge */}
        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] text-white flex items-center gap-1 ${categoryColors[category]}`}>
          {categoryIcons[category]}
          <span>{category}</span>
        </div>
        
        {/* Variant Badge - shows 变体 for secondary assets, shows count for primary assets with variants */}
        {isSecondaryAsset ? (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500 text-[8px] text-white">
            变体
          </div>
        ) : hasVariants ? (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500 text-[8px] text-white">
            {asset.variants?.length} 变体
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
