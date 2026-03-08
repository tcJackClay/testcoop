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
type AssetStore = AssetState & AssetActions;
// 从 assetType 字段映射到中文类型
const mapAssetTypeToCategory = (assetType?: string): string => {
  if (!assetType) return '次要道具';
  // 处理如 character_primary, scene_primary 等格式
  if (assetType.includes('character') && assetType.includes('primary')) return '主要角色';
  if (assetType.includes('character') && assetType.includes('secondary')) return '次要角色';
  if (assetType.includes('scene') && assetType.includes('primary')) return '主要场景';
  if (assetType.includes('scene') && assetType.includes('secondary')) return '次要场景';
  if (assetType.includes('prop') && assetType.includes('primary')) return '主要道具';
  if (assetType.includes('prop') && assetType.includes('secondary')) return '次要道具';
  // 兼容旧的命名方式
  if (assetType.includes('主要') && assetType.includes('角色')) return '主要角色';
  if (assetType.includes('次要') && assetType.includes('角色')) return '次要角色';
  if (assetType.includes('主要') && assetType.includes('场景')) return '主要场景';
  if (assetType.includes('次要') && assetType.includes('场景')) return '次要场景';
  if (assetType.includes('主要') && assetType.includes('道具')) return '主要道具';
  if (assetType.includes('次要') && assetType.includes('道具')) return '次要道具';
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
          
          // 类型过滤 - 使用 mapAssetTypeToCategory 从正确的字段获取类型
          if (filterType !== 'all') {
            // 优先从 ext1 解析变体信息
            let assetCategory = '次要道具';
            if (asset.ext1) {
              try {
                const ext1Data = JSON.parse(asset.ext1);
                if (ext1Data.parent) {
                  // 有 parent 说明是变体（二级资产）
                  const parentName = ext1Data.parent;
                  // 从父资产名称推断类型
                  if (parentName.includes('角色')) assetCategory = '次要角色';
                  else if (parentName.includes('场景')) assetCategory = '次要场景';
                  else if (parentName.includes('道具')) assetCategory = '次要道具';
                }
              } catch (e) {
                // ext1 不是 JSON，尝试直接解析
                assetCategory = mapAssetTypeToCategory(asset.ext1);
              }
            }
            // 如果从 ext1 没找到，使用 resourceType
            if (assetCategory === '次要道具' && asset.resourceType) {
              assetCategory = mapAssetTypeToCategory(asset.resourceType);
            }
            
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