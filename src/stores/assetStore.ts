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
}
// 从 assetType 字段映射到中文类型
const mapAssetTypeToCategory = (assetType?: string): string => {
  if (!assetType) return '次要道具';
  const lowerType = assetType.toLowerCase();
  // 处理如 character_primary, scene_primary 等格式
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

// 从资产对象获取分类
const getAssetCategory = (asset: any, allAssets: any[]): string => {
  // 1. 首先检查 ext1 JSON 中的信息
  if (asset.ext1) {
    try {
      const ext1Data = JSON.parse(asset.ext1);
      // 检查是否是变体（有 parent 字段）
      if (ext1Data.parent) {
        // 是变体，从父资产推断类型
        const parentAsset = allAssets.find(a => a.name === ext1Data.parent || a.resourceName === ext1Data.parent);
        if (parentAsset) {
          const parentCategory = mapAssetTypeToCategory(parentAsset.resourceType);
          // 将主要改为次要
          return parentCategory.replace('主要', '次要');
        }
        // 如果找不到父资产，从 parent 名称推断
        const parentName = ext1Data.parent;
        if (parentName.includes('角色')) return '次要角色';
        if (parentName.includes('场景')) return '次要场景';
        if (parentName.includes('道具')) return '次要道具';
      }
      // 检查 ext1 中是否有直接的 type 字段
      if (ext1Data.type) {
        return mapAssetTypeToCategory(ext1Data.type);
      }
    } catch (e) {
      // ext1 不是有效 JSON，尝试直接解析
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
          set({ assets: images || [], isLoading: false });
        } catch (error) {
          console.error('Failed to fetch assets:', error);
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
          // 类型过滤 - 使用 getAssetCategory 获取正确的分类
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