// src/stores/assets/assetStore.ts - 资产 Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { imageApi, Image } from '@/api/image';
import { AssetStore, AssetCategory } from './assetTypes';
import { mapCategoryToExt1Type, getAssetCategory, filterAssets } from './assetHelpers';

// 获取当前项目 ID
const getCurrentProjectId = (): number | undefined => {
  // 从 projectStore 的 localStorage 获取
  try {
    const projectStr = localStorage.getItem('project-storage');
    if (projectStr) {
      const projectData = JSON.parse(projectStr);
      if (projectData.state?.currentProjectId) {
        return projectData.state.currentProjectId;
      }
    }
  } catch {}
  return undefined;
};

const getInitialState = () => ({
  assets: [] as Image[],
  selectedAssetId: null as number | null,
  filterType: 'all' as AssetCategory,
  searchTerm: '',
  isLoading: false,
  error: null as string | null,
  draggedAsset: null as Image | null,
  isDragging: false,
});

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      fetchAssets: async () => {
        const projectId = getCurrentProjectId();
        if (!projectId) {
          set({ assets: [], isLoading: false, error: null });
          return;
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await imageApi.getAll(projectId);
          
          // API 直接返回数组，不需要检查 code
          if (Array.isArray(response)) {
            set({ assets: response, isLoading: false });
          } else if (response.code === 0 && response.data) {
            set({ assets: response.data, isLoading: false });
          } else {
            set({ error: '获取资产列表失败', isLoading: false });
          }
        } catch (error) {
          set({ error: '获取资产列表失败', isLoading: false });
        }
      },

      addAsset: (asset: Image) => {
        set(state => ({ assets: [...state.assets, asset] }));
      },

      updateAsset: (id: number, updates: Partial<Image>) => {
        set(state => ({
          assets: state.assets.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
      },

      deleteAsset: async (id: number) => {
        try {
          await imageApi.delete(id);
          set(state => ({
            assets: state.assets.filter(a => a.id !== id),
            selectedAssetId: state.selectedAssetId === id ? null : state.selectedAssetId
          }));
        } catch (error) {
          set({ error: '删除资产失败' });
        }
      },

      selectAsset: (id: number | null) => {
        set({ selectedAssetId: id });
      },

      setFilterType: (filterType: AssetCategory) => {
        set({ filterType });
      },

      setSearchTerm: (searchTerm: string) => {
        set({ searchTerm });
      },

      setDraggedAsset: (draggedAsset: Image | null) => {
        set({ draggedAsset });
      },

      setIsDragging: (isDragging: boolean) => {
        set({ isDragging });
      },

      getFilteredAssets: () => {
        const { assets, filterType, searchTerm } = get();
        return filterAssets(assets, filterType, searchTerm);
      },

      // 更新资产分类 - 只更新 ext1 中的 type 字段
      updateAssetCategory: async (id: number, category: string) => {
        const ext1Type = mapCategoryToExt1Type(category);
        const { assets } = get();
        const asset = assets.find(a => a.id === id);
        
        let ext1Obj: Record<string, unknown> = {};
        if (asset?.ext1) {
          try { ext1Obj = JSON.parse(asset.ext1); } catch {}
        }
        ext1Obj.type = ext1Type;

        try {
          await imageApi.put(id, { ext1: JSON.stringify(ext1Obj) });
          set(state => ({
            assets: state.assets.map(a =>
              a.id === id ? { ...a, ext1: JSON.stringify(ext1Obj) } : a
            ),
          }));
        } catch (error) {
          set({ error: '更新分类失败，请重试' });
        }
      },

      // 同步变体关系
      syncVariants: async () => {
        const { assets } = get();
        let count = 0;
        const newAssets: Image[] = [];

        for (const asset of assets) {
          const resourceName = asset.name || asset.resourceName || '';
          if (resourceName.includes(' - ')) {
            const parentName = resourceName.split(' - ')[0].trim();
            let ext1Obj: Record<string, unknown> = {};
            try {
              if (asset.ext1) ext1Obj = JSON.parse(asset.ext1);
            } catch {}
            ext1Obj.parent = parentName;

            const parentAsset = assets.find(a => 
              (a.name || a.resourceName) === parentName
            );
            if (parentAsset) {
              let parentExt1: Record<string, unknown> = {};
              try {
                if (parentAsset.ext1) parentExt1 = JSON.parse(parentAsset.ext1);
              } catch {}
              ext1Obj.type = parentExt1.type || 'prop_secondary';
            }

            try {
              await imageApi.put(asset.id, { ext1: JSON.stringify(ext1Obj) });
              newAssets.push({ ...asset, ext1: JSON.stringify(ext1Obj) });
              count++;
            } catch {}
          }
        }

        if (newAssets.length > 0) {
          set(state => ({
            assets: state.assets.map(a => {
              const updated = newAssets.find(n => n.id === a.id);
              return updated || a;
            }),
          }));
        }

        return count;
      },
    }),
    {
      name: 'aigc-asset-storage',
      partialize: (state) => ({
        filterType: state.filterType,
        searchTerm: state.searchTerm,
      }),
    }
  )
);
