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

// Non-JSX helper functions
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
