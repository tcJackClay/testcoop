// Pure types - no JSX, no hooks dependencies

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

export type AssetCategory = '主要角色' | '次要角色' | '主要场景' | '次要场景' | '主要道具' | '次要道具';

// 中文分类到 ext1.type 的映射
export const mapCategoryToExt1Type = (category: string): string => {
  switch (category) {
    case '主要角色': return 'character_primary';
    case '次要角色': return 'character_secondary';
    case '主要场景': return 'scene_primary';
    case '次要场景': return 'scene_secondary';
    case '主要道具': return 'prop_primary';
    case '次要道具': return 'prop_secondary';
    default: return 'prop_secondary';
  }
};

// ext1.type 到中文分类的映射
export const mapExt1TypeToCategory = (ext1Type?: string): string => {
  if (!ext1Type) return '次要道具';
  const lowerType = ext1Type.toLowerCase();
  if (lowerType.includes('character') && lowerType.includes('primary')) return '主要角色';
  if (lowerType.includes('character') && lowerType.includes('secondary')) return '次要角色';
  if (lowerType.includes('scene') && lowerType.includes('primary')) return '主要场景';
  if (lowerType.includes('scene') && lowerType.includes('secondary')) return '次要场景';
  if (lowerType.includes('prop') && lowerType.includes('primary')) return '主要道具';
  if (lowerType.includes('prop') && lowerType.includes('secondary')) return '次要道具';
  return '次要道具';
};

// 兼容旧函数名 - 只使用 ext1 信息
export const mapCategoryToType = mapCategoryToExt1Type;
