// Asset Types

export type AssetCategory = 
  | '主要角色' 
  | '次要角色' 
  | '主要场景' 
  | '次要场景' 
  | '主要道具' 
  | '次要道具';

export interface Asset {
  id: string;
  name: string;
  description?: string;
  category: AssetCategory;
  imageUrl?: string;
  videoUrl?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetWithVariants extends Asset {
  variants?: string[];  // 变体名称数组
  parentId?: string;      // 父资产ID（二级资产引用主要资产）
}

export interface AssetStats {
  主要角色: number;
  次要角色: number;
  主要场景: number;
  次要场景: number;
  主要道具: number;
  次要道具: number;
}

export const DEFAULT_ASSET_STATS: AssetStats = {
  主要角色: 0,
  次要角色: 0,
  主要场景: 0,
  次要场景: 0,
  主要道具: 0,
  次要道具: 0,
};

export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  '主要角色': 'blue',
  '次要角色': 'blue',
  '主要场景': 'green',
  '次要场景': 'green',
  '主要道具': 'orange',
  '次要道具': 'orange',
};

export const CATEGORY_ICONS: Record<AssetCategory, string> = {
  '主要角色': 'star',
  '次要角色': 'person',
  '主要场景': 'landscape',
  '次要场景': 'place',
  '主要道具': 'diamond',
  '次要道具': 'category',
};
