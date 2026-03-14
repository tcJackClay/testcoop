// src/stores/assets/assetHelpers.ts - 资产辅助函数
import { Image } from '../../api/image';

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

// 从资产对象获取分类（统一从 ext1 推断）
export const getAssetCategory = (asset: Image, allAssets: Image[]): string => {
  if (asset.ext1) {
    try {
      const ext1Data = JSON.parse(asset.ext1);
      
      // 1. 检查 parent（变体）- 变体使用独立分类逻辑
      if (ext1Data.parent) {
        // TODO: 变体分类需要根据实际业务逻辑处理
        // 当前暂时返回父资产的分类
        const parentName = ext1Data.parent;
        const parentAsset = allAssets.find((a: Image) => {
          const assetName = a.name || a.resourceName || '';
          return assetName === parentName || assetName.startsWith(parentName + ' - ');
        });
        
        if (parentAsset?.ext1) {
          try {
            const parentExt1 = JSON.parse(parentAsset.ext1);
            return mapExt1TypeToCategory(parentExt1.type);
          } catch {}
        }
        
        // 从名称推断
        if (parentName.includes('角色')) return '主要角色';
        if (parentName.includes('场景')) return '主要场景';
        if (parentName.includes('道具')) return '主要道具';
        
        return '主要角色';
      }
      
      // 2. 直接从 type 推断
      if (ext1Data.type) {
        return mapExt1TypeToCategory(ext1Data.type);
      }
    } catch (e) {}
  }
  
  return '次要道具';
};

// 筛选资产
export const filterAssets = (
  assets: Image[],
  filterType: string,
  searchTerm: string
): Image[] => {
  let filtered = [...assets];
  
  // 按分类筛选
  if (filterType && filterType !== 'all') {
    filtered = filtered.filter(asset => {
      const category = getAssetCategory(asset, assets);
      return category === filterType;
    });
  }
  
  // 按搜索词筛选
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(asset => {
      const name = (asset.name || asset.resourceName || '').toLowerCase();
      return name.includes(term);
    });
  }
  
  return filtered;
};
