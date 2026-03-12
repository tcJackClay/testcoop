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

// 从中文分类映射到 resourceType 格式
const mapCategoryToAssetType = (category: string): string => {
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

// �?assetType 字段映射到中文类�?
const mapAssetTypeToCategory = (assetType?: string): string => {
  if (!assetType) return '次要道具';
  const lowerType = assetType.toLowerCase();
  // 处理�?character_primary, scene_primary 等格�?
  if (lowerType.includes('character') && lowerType.includes('primary')) return '主要角色';
  if (lowerType.includes('character') && lowerType.includes('secondary')) return '次要角色';
  if (lowerType.includes('scene') && lowerType.includes('primary')) return '主要场景';
  if (lowerType.includes('scene') && lowerType.includes('secondary')) return '次要场景';
  if (lowerType.includes('prop') && lowerType.includes('primary')) return '主要道具';
  if (lowerType.includes('prop') && lowerType.includes('secondary')) return '次要道具';
  // 兼容旧的命名方式
  if (assetType.includes('主要') && assetType.includes('角色')) return '主要角色';
  if (assetType.includes('次要') && assetType.includes('角色')) return '次要角色';
  if (assetType.includes('主要') && assetType.includes('场景')) return '主要场景';
  if (assetType.includes('次要') && assetType.includes('场景')) return '次要场景';
  if (assetType.includes('主要') && assetType.includes('道具')) return '主要道具';
  if (assetType.includes('次要') && assetType.includes('道具')) return '次要道具';
  return '次要道具';
};

// 从资产对象获取分�?
const getAssetCategory = (asset: any, allAssets: any[]): string => {
  const resourceName = asset.resourceName || asset.name || '';
  
  // 0. 检查名称是否包�?" - " （变体命名模式）
  // 如果是变体，从父资产名称推断类型
  if (resourceName.includes(' - ')) {
    const parentName = resourceName.split(' - ')[0].trim();
    // 尝试从父资产名称推断类型
    if (parentName.includes('角色')) return '次要角色';
    if (parentName.includes('场景')) return '次要场景';
    if (parentName.includes('道具')) return '次要道具';
    // 查找父资产获取类�?
    const parentAsset = allAssets.find((a: any) => 
      (a.name === parentName || a.resourceName === parentName)
    );
    if (parentAsset) {
      const parentCategory = mapAssetTypeToCategory(parentAsset.resourceType);
      return parentCategory.replace('主要', '次要');
    }
  }
  
  // 1. 首先检�?ext1 JSON 中的信息
  if (asset.ext1) {
    try {
      const ext1Data = JSON.parse(asset.ext1);
      // 检查是否是变体（有 parent 字段�?
      if (ext1Data.parent) {
        // 是变体，从父资产推断类型
        const parentAsset = allAssets.find(a => a.name === ext1Data.parent || a.resourceName === ext1Data.parent);
        if (parentAsset) {
          const parentCategory = mapAssetTypeToCategory(parentAsset.resourceType);
          // 将主要改为次�?
          return parentCategory.replace('主要', '次要');
        }
        // 如果找不到父资产，从 parent 名称推断
        const parentName = ext1Data.parent;
        if (parentName.includes('角色')) return '次要角色';
        if (parentName.includes('场景')) return '次要场景';
        if (parentName.includes('道具')) return '次要道具';
      }
      // 检�?ext1 中是否有直接�?type 字段
      if (ext1Data.type) {
        return mapAssetTypeToCategory(ext1Data.type);
      }
    } catch (e) {
      // ext1 不是有效 JSON，尝试直接解�?
      return mapAssetTypeToCategory(asset.ext1);
    }
  }
  
  // 2. 使用 resourceType 字段
  if (asset.resourceType && asset.resourceType !== 'image') {
    return mapAssetTypeToCategory(asset.resourceType);
  }
  
  // 3. 默认返回次要道具
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
            
            // 获取图片 base64 - 调用单独�?getImage API
            if (image.id) {
              try {
                const imageResource: any = await imageApi.getImage(image.id);
                console.log(`[资产${image.id}] getImage返回:`, imageResource);
                
                let base64 = imageResource?.resourceContent;
                
                // 如果 resourceContent 不存在，尝试直接使用 imageResource（可能是 base64 字符串本身）
                if (!base64 && typeof imageResource === 'string' && imageResource.length > 100) {
                  base64 = imageResource;
                }
                
                // 解析 JSON 格式 {data: 'iVBORw0...'} �?{image: '...'}
                if (base64 && base64.startsWith('{')) {
                  try {
                    const jsonContent = JSON.parse(base64);
                    base64 = jsonContent.image || jsonContent.data || '';
                    console.log(`[资产${image.id}] 解析JSON�?base64长度:`, base64?.length);
                  } catch (e) {
                    console.warn(`[assetStore] 解析图片JSON失败, id=${image.id}:`, e);
                  }
                }
                
                // 转换�?data URL
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
                  console.log(`[资产${image.id}] �?获取图片成功, imageUrl长度=${imageUrl.length}`);
                } else {
                  console.warn(`[资产${image.id}] 警告: base64为空, imageResource=`, imageResource);
                }
              } catch (e) {
                console.error(`[assetStore] 获取图片${image.id}失败:`, e);
              }
            }
            
            // 备用：也从列表API�?resourceContent 解析（如�?getImage 返回空）
            if (!imageUrl && image.resourceContent) {
              let listBase64 = image.resourceContent;
              
              // 情况1: JSON 格式 {image: '...'} �?{data: '...'}
              if (listBase64.startsWith('{')) {
                try {
                  const jsonContent = JSON.parse(listBase64);
                  listBase64 = jsonContent.image || jsonContent.data || '';
                  if (listBase64) {
                    let mimeType = 'image/png';
                    if (listBase64.startsWith('/9j/')) mimeType = 'image/jpeg';
                    else if (listBase64.startsWith('iVBOR')) mimeType = 'image/png';
                    else if (listBase64.startsWith('UklGR')) mimeType = 'image/webp';
                    imageUrl = `data:${mimeType};base64,${listBase64}`;
                  }
                } catch (e) {}
              }
              // 情况2: 文件路径 images/xxx.jpg -> 需要转换为 URL
              else if (listBase64.startsWith('images/') || listBase64.startsWith('/images/')) {
                // 假设后端提供图片访问服务，拼接完�?URL
                // 需要根据实际情况修改图片服务的基础 URL
                imageUrl = listBase64; // 或者拼接后端图片服务地址
              }
              // 情况3: base64 原始数据
              else if (listBase64.startsWith('/9j/') || listBase64.startsWith('iVBOR') || listBase64.startsWith('UklGR')) {
                let mimeType = 'image/png';
                if (listBase64.startsWith('/9j/')) mimeType = 'image/jpeg';
                else if (listBase64.startsWith('iVBOR')) mimeType = 'image/png';
                else if (listBase64.startsWith('UklGR')) mimeType = 'image/webp';
                imageUrl = `data:${mimeType};base64,${listBase64}`;
              }
              // 情况4: 已经是完�?URL
              else if (listBase64.startsWith('http') || listBase64.startsWith('/')) {
                imageUrl = listBase64;
              }
            }
            
            return {
              ...image,
              resourceContent: imageUrl || image.resourceContent,
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
      
      // 更新资产分类
      updateAssetCategory: async (id: number, category: string) => {
        const assetType = mapCategoryToAssetType(category);
        
        // 解析现有 ext1
        const { assets } = get();
        const asset = assets.find(a => a.id === id);
        let ext1Obj: any = {};
        
        if (asset?.ext1) {
          try {
            ext1Obj = JSON.parse(asset.ext1);
          } catch (e) {}
        }
        
        // 更新 ext1 中的 type
        ext1Obj.type = assetType;
        
        try {
          // 更新到后�?
          await imageApi.put(id, {
            resourceType: assetType,
            ext1: JSON.stringify(ext1Obj)
          });
          
          // 更新本地状�?
          set((state) => ({
            assets: state.assets.map((a) =>
              a.id === id 
                ? { 
                    ...a, 
                    resourceType: assetType,
                    ext1: JSON.stringify(ext1Obj)
                  } 
                : a
            ),
          }));
          
          console.log(`[assetStore] 更新资产 ${id} 分类�?${category} (${assetType})`);
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

// 全局调试方法 - 可在控制台直接调�?
window.debugAssetStore = {
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
