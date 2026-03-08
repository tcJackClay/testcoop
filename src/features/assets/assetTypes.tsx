import {
  Folder,
  Star,
  User,
  Mountain,
  MapPin,
  Gem,
  Package,
} from 'lucide-react';
import type { Image } from '../../api/image';

// Types
export interface AssetLibraryPanelProps {
  onClose: () => void;
}

export interface AssetStats {
  主要角色: number;
  次要角色: number;
  主要场景: number;
  次要场景: number;
  主要道具: number;
  次要道具: number;
}

export type AssetCategory =
  | '主要角色'
  | '次要角色'
  | '主要场景'
  | '次要场景'
  | '主要道具'
  | '次要道具';

// Constants
export const categories = [
  { key: 'all', label: '所有资产', icon: <Folder size={12} />, color: 'text-gray-400' },
  { key: '主要角色', label: '主要角色', icon: <Star size={12} />, color: 'text-blue-400' },
  { key: '次要角色', label: '次要角色', icon: <User size={12} />, color: 'text-blue-400' },
  { key: '主要场景', label: '主要场景', icon: <Mountain size={12} />, color: 'text-green-400' },
  { key: '次要场景', label: '次要场景', icon: <MapPin size={12} />, color: 'text-green-400' },
  { key: '主要道具', label: '主要道具', icon: <Gem size={12} />, color: 'text-orange-400' },
  { key: '次要道具', label: '次要道具', icon: <Package size={12} />, color: 'text-orange-400' },
];

// Helper functions
export const mapCategoryToType = (category?: string): string => {
  if (!category) return '次要道具';
  if (category.includes('主要') && category.includes('角色')) return '主要角色';
  if (category.includes('次要') && category.includes('角色')) return '次要角色';
  if (category.includes('主要') && category.includes('场景')) return '主要场景';
  if (category.includes('次要') && category.includes('场景')) return '次要场景';
  if (category.includes('主要') && category.includes('道具')) return '主要道具';
  if (category.includes('次要') && category.includes('道具')) return '次要道具';
  return '次要道具';
};

export const isSecondaryAsset = (asset: Image): boolean => {
  return !!asset.parentId && asset.parentId.length > 0;
};

export const isPrimaryAsset = (asset: Image): boolean => {
  return !isSecondaryAsset(asset);
};
