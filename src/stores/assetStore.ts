import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Image, imageApi } from '../api/image';
import useProjectStore from './projectStore';

interface AssetState {
  assets: Image[];
  selectedAssetId: number | null;
  filterType: 'all' | '主要角色' | '次要角色' | '主要场景' | '次要场景' | '主要道具' | '次要道具';
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
  draggedAsset: Image | null;
  isDragging: boolean;
}

interface AssetActions {
  fetchAssets: () => Promise<void>;
  addAsset: (asset: Image) => void;
  updateAsset: (id: number, updates: Partial<Image>) => void;
  deleteAsset: (id: number) => Promise<void>;
  selectAsset: (id: number | null) => void;
  setFilterType: (type: 'all' | '主要角色' | '次要角色' | '主要场景' | '次要场景' | '主要道具' | '次要道具') => void;
  setSearchTerm: (term: string) => void;
  setDraggedAsset: (asset: Image | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  getFilteredAssets: () => Image[];
  updateAssetCategory: (id: number, category: string) => Promise<void>;
  syncVariants: () => Promise<number>;
}

type AssetStore = AssetState & AssetActions;

// 从中文分类映射到 ext1.type 格式
const mapCategoryToExt1Type = (category: string): string => {
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

// 从 ext1.type 映射到中文分类
const mapExt1TypeToCategory = (ext1Type?: string): string => {
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
const getAssetCategory = (asset: any, allAssets: any[]): string => {
  // 只从 ext1 推断
  if (asset.ext1) {
    try {
      const ext1Data = JSON.parse(asset.ext1);
      
      // 1. 检查 parent（变体）
      if (ext1Data.parent) {
        const parentName = ext1Data.parent;
        // 查找父资产
        const parentAsset = allAssets.find((a: any) => 
          a.name === parentName || a.resourceName === parentName
        );
        if (parentAsset?.ext1) {
          try {
            const parentExt1 = JSON.parse(parentAsset.ext1);
            return mapExt1TypeToCategory(parentExt1.type);
          } catch {}
        }
        // 从名称推断
        if (parentName.includes('角色')) return '次要角色';
        if (parentName.includes('场景')) return '次要场景';
        if (parentName.includes('道具')) return '次要道具';
      }
      
      // 2. 直接从 type 推断
      if (ext1Data.type) {
        return mapExt1TypeToCategory(ext1Data.type);
      }
    } catch (e) {}
  }
  
  return '次要道具';
};

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      assets: [],
      selectedAssetId: null,
      filterType: 'all',
      searchTerm: '',
      isLoading: false,
      error: null,
      draggedAsset: null,
      isDragging: false,
      
      fetchAssets: async () => {
        const projectId = useProjectStore.getState().currentProjectId;
        
        if (!projectId) {
          set({ assets: [], isLoading: false });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const images = await imageApi.getAll(projectId);
          
          // 遍历每个资产，获取图�?base64
          const processedAssets = await Promise.all((images || []).map(async (image) => {
            let parentId = '';
            let variants: string[] = [];
            let imageUrl = '';
            
            // 解析 ext1
            if (image.ext1) {
              try {
                const ext1Data = JSON.parse(image.ext1);
                parentId = ext1Data.parent || ext1Data.parentId || '';
                if (ext1Data.variants && Array.isArray(ext1Data.variants)) {
                  variants = ext1Data.variants.filter((v: any) => typeof v === 'string' && v.length > 0);
                }
              } catch (e) {}
            }
            
            // 获取图片 base64 - 调用 getImage API
            if (image.id) {
              try {
                const imageResource: any = await imageApi.getImage(image.id);
                let base64 = imageResource?.resourceContent;
                
                if (!base64 && typeof imageResource === 'string' && imageResource.length > 100) {
                  base64 = imageResource;
                }
                
                // 解析 JSON 格式
                if (base64 && base64.startsWith('{')) {
                  try {
                    const jsonContent = JSON.parse(base64);
                    base64 = jsonContent.image || jsonContent.data || '';
                  } catch (e) {}
                }
                
                // 转换为 data URL
                if (base64) {
                  if (base64.startsWith('data:')) {
                    imageUrl = base64;
                  } else {
                    let mimeType = 'image/png';
                    if (base64.startsWith('/9j/')) mimeType = 'image/jpeg';
                    else if (base64.startsWith('iVBOR')) mimeType = 'image/png';
                    else if (base64.startsWith('UklGR')) mimeType = 'image/webp';
                    imageUrl = `data:${mimeType};base64,${base64}`;
                  }
                }
              } catch (e) {}
            }
            
            return {
              ...image,
              resourceContent: imageUrl || '',
              parentId,
              variants,
            };
          }));
          
          set({ assets: processedAssets, isLoading: false });
        } catch (error) {
          set({ error: '网络错误，请稍后重试', isLoading: false });
        }
      },
      
      addAsset: (asset) => {
        set((state) => ({
          assets: [...state.assets, asset],
        }));
      },
      
      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === id ? { ...asset, ...updates } : asset
          ),
        }));
      },
      
      deleteAsset: async (id) => {
        try {
          const success = await imageApi.delete(id);
          
          if (success) {
            set((state) => ({
              assets: state.assets.filter((asset) => asset.id !== id),
              selectedAssetId: state.selectedAssetId === id ? null : state.selectedAssetId,
            }));
          } else {
            set({ error: '删除失败' });
          }
        } catch (error) {
          console.error('Failed to delete asset:', error);
          set({ error: '网络错误，请稍后重试' });
        }
      },
      
      selectAsset: (id) => {
        set({ selectedAssetId: id });
      },
      
      setFilterType: (type) => {
        set({ filterType: type });
      },
      
      setSearchTerm: (term) => {
        set({ searchTerm: term });
      },
      
      setDraggedAsset: (asset) => {
        set({ draggedAsset: asset });
      },
      
      setIsDragging: (isDragging) => {
        set({ isDragging });
      },
      
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      getFilteredAssets: () => {
        const { assets, filterType, searchTerm } = get();
        const projectId = useProjectStore.getState().currentProjectId;
        
        return assets.filter((asset) => {
          // 项目过滤
          if (projectId && asset.projectId !== projectId) {
            return false;
          }
          // 类型过滤 - 使用 getAssetCategory 获取正确的分�?
          if (filterType !== 'all') {
            const assetCategory = getAssetCategory(asset, assets);
            if (assetCategory !== filterType) {
              return false;
            }
          }
          
          // 搜索过滤
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesSearch = 
              asset.name?.toLowerCase().includes(term) ||
              (asset.resourceName && asset.resourceName.toLowerCase().includes(term)) ||
              (asset.format && asset.format.toLowerCase().includes(term));
            
            if (!matchesSearch) {
              return false;
            }
          }
          
          return true;
        });
      },
      
      // 更新资产分类 - 只更新 ext1 中的 type 字段
      updateAssetCategory: async (id: number, category: string) => {
        const ext1Type = mapCategoryToExt1Type(category);
        
        // 解析现有 ext1
        const { assets } = get();
        const asset = assets.find(a => a.id === id);
        let ext1Obj: any = {};
        
        if (asset?.ext1) {
          try {
            ext1Obj = JSON.parse(asset.ext1);
          } catch (e) {}
        }
        
        // 只更新 ext1 中的 type
        ext1Obj.type = ext1Type;
        
        console.log('[assetStore] 更新资产分类:', { id, category, ext1Type, ext1: JSON.stringify(ext1Obj) });
        
        try {
          // 只更新 ext1，不更新 resourceType
          const result = await imageApi.put(id, {
            ext1: JSON.stringify(ext1Obj)
          });
          
          console.log('[assetStore] 更新结果:', result);
          
          // 更新本地状态
          set((state) => ({
            assets: state.assets.map((a) =>
              a.id === id 
                ? { 
                    ...a, 
                    ext1: JSON.stringify(ext1Obj)
                  } 
                : a
            ),
          }));
          
          console.log(`[assetStore] 更新资产 ${id} 分类成功: ${category} (${ext1Type})`);
        } catch (error) {
          console.error('[assetStore] 更新资产分类失败:', error);
          set({ error: '更新分类失败，请重试' });
        }
      },
      
      // 同步变体关系 - 识别名称中的 " - " 并建�?parent-variant 关系
      syncVariants: async () => {
        const { assets } = get();
        let updatedCount = 0;
        
        // 第一步：识别所有变体并更新变体资产�?parent
        for (const asset of assets) {
          const resourceName = asset.resourceName || asset.name || '';
          const assetId = asset.id;
          
          // 检查是否是变体（名称包�?" - "�?
          if (resourceName.includes(' - ')) {
            const parts = resourceName.split(' - ');
            const parentName = parts[0].trim();
            const variantName = parts.slice(1).join(' - ').trim();
            
            // 检查 ID 是否有效
            if (!assetId || assetId === 0) {
              continue;
            }
            
            // 解析现有 ext1
            let ext1Obj: any = {};
            if (asset.ext1) {
              try {
                ext1Obj = JSON.parse(asset.ext1);
              } catch (e) {}
            }
            
            // 如果没有 parent 字段，添加它
            if (!ext1Obj.parent || ext1Obj.parent === '') {
              ext1Obj.parent = parentName;
              
              // 如果没有 variants 数组，添加它
              if (!ext1Obj.variants) {
                ext1Obj.variants = [];
              }
              // 添加当前变体名称
              if (!ext1Obj.variants.includes(variantName)) {
                ext1Obj.variants.push(variantName);
              }
              
              try {
                await imageApi.put(assetId, {
                  resourceName: asset.resourceName,
                  resourceType: asset.resourceType,
                  resourceContent: asset.resourceContent,
                  ext1: JSON.stringify(ext1Obj),
                  ext2: asset.ext2,
                });
                updatedCount++;
              } catch (e) {
                console.error('更新变体失败:', e);
              }
            }
          }
        }
        
        // 第二步：更新父资产的 variants 数组
        for (const asset of assets) {
          const resourceName = asset.resourceName || asset.name || '';
          
          // 如果是父资产（没�?" - "），查找所有相关变�?
          if (!resourceName.includes(' - ')) {
            // 查找所有以该名称开头的变体
            const variants = assets.filter(a => {
              const aName = a.resourceName || a.name || '';
              return aName.startsWith(resourceName + ' - ') || aName === resourceName;
            }).filter(a => a.id !== asset.id);
            
            if (variants.length > 0) {
              // 解析现有 ext1
              let ext1Obj: any = {};
              if (asset.ext1) {
                try {
                  ext1Obj = JSON.parse(asset.ext1);
                } catch (e) {}
              }
              
              // 初始�?variants 数组
              if (!ext1Obj.variants) {
                ext1Obj.variants = [];
              }
              
              // 添加所有变体名�?
              let hasNew = false;
              for (const variant of variants) {
                const vName = variant.resourceName || variant.name || '';
                const variantPart = vName.replace(resourceName, '').replace(' - ', '').trim();
                if (variantPart && !ext1Obj.variants.includes(variantPart)) {
                  ext1Obj.variants.push(variantPart);
                  hasNew = true;
                }
              }
              
              if (hasNew) {
                try {
                  await imageApi.put(asset.id!, {
                    resourceName: asset.resourceName,
                    resourceType: asset.resourceType,
                    resourceContent: asset.resourceContent,
                    ext1: JSON.stringify(ext1Obj),
                    ext2: asset.ext2,
                  });
                  updatedCount++;
                  console.log(`[assetStore] 更新父资�?${asset.id} variants:`, ext1Obj.variants);
                } catch (e) {
                  console.error(`[assetStore] 更新父资产失�?`, e);
                }
              }
            }
          }
        }
        
        // 重新获取资产列表
        await get().fetchAssets();
        return updatedCount;
      },
      
      // 调试方法：手动获取单个图�?
      debugFetchImage: async (id: number) => {
        console.log(`[DEBUG] 开始获取图�?id=${id}`);
        try {
          const result = await imageApi.getImage(id);
          console.log(`[DEBUG] imageApi.getImage(${id}) 返回:`, result);
          return result;
        } catch (e) {
          console.error(`[DEBUG] 获取失败:`, e);
          return null;
        }
      },
      
      // 调试方法：查看列表中第一个图片的 resourceContent
      debugListContent: () => {
        const { assets } = get();
        if (assets.length > 0) {
          console.log('[DEBUG] 列表中第一个资产的 resourceContent:', assets[0].resourceContent);
          return assets[0].resourceContent;
        }
        console.log('[DEBUG] 资产列表为空');
        return null;
      }
    }),
    {
      name: 'asset-storage',
      partialize: (state) => ({
        filterType: state.filterType,
      }),
    }
  )
);
export default useAssetStore;

// 全局调试方法 - 可在控制台直接调用
window.debugAssetStore = {
  // 查看所有变体资产
  listVariants: () => {
    const store = useAssetStore.getState();
    const assets = store.assets;
    const variants = assets.filter(a => a.parentId || (a.name && a.name.includes(' - ')));
    console.log('=== 变体资产数量:', variants.length);
    variants.forEach((v, i) => {
      console.log(`[${i}] ${v.name}`);
      console.log('    resourceContent:', v.resourceContent?.substring(0, 80));
      console.log('    ext1:', v.ext1);
    });
    return variants;
  },
  // 查看列表中第一个图片的 resourceContent
  listContent: () => {
    const store = useAssetStore.getState();
    const assets = store.assets;
    if (assets.length > 0) {
      console.log('=== 列表中第一个资产的原始数据 ===');
      console.log('resourceContent:', assets[0].resourceContent);
      console.log('resourceType:', assets[0].resourceType);
      console.log('resourceName:', assets[0].resourceName);
      console.log('完整对象:', assets[0]);
      return assets[0].resourceContent;
    }
    console.log('资产列表为空');
    return null;
  },
  // 手动获取单个图片
  fetchImage: async (id) => {
    const { imageApi } = await import('../api/image');
    console.log(`=== 获取图片 id=${id} ===`);
    const result = await imageApi.getImage(id);
    console.log('返回结果:', result);
    return result;
  }
};
