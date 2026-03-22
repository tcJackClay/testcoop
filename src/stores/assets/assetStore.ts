import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { imageApi, type Image } from '@/api/image';
import type { AssetCategory, AssetStore } from './assetTypes';
import { filterAssets, mapCategoryToExt1Type } from './assetHelpers';

const getCurrentProjectId = (): number | undefined => {
  try {
    const projectStr = localStorage.getItem('project-storage');
    if (!projectStr) return undefined;

    const projectData = JSON.parse(projectStr);
    return projectData.state?.currentProjectId;
  } catch {
    return undefined;
  }
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
          const assets = await imageApi.getAll(projectId);
          set({ assets, isLoading: false });
        } catch {
          set({ error: '获取资产列表失败', isLoading: false });
        }
      },

      addAsset: (asset) => {
        set((state) => ({ assets: [...state.assets, asset] }));
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((asset) => (asset.id === id ? { ...asset, ...updates } : asset)),
        }));
      },

      deleteAsset: async (id) => {
        try {
          await imageApi.delete(id);
          set((state) => ({
            assets: state.assets.filter((asset) => asset.id !== id),
            selectedAssetId: state.selectedAssetId === id ? null : state.selectedAssetId,
          }));
        } catch {
          set({ error: '删除资产失败' });
        }
      },

      selectAsset: (selectedAssetId) => {
        set({ selectedAssetId });
      },

      setFilterType: (filterType) => {
        set({ filterType });
      },

      setSearchTerm: (searchTerm) => {
        set({ searchTerm });
      },

      setDraggedAsset: (draggedAsset) => {
        set({ draggedAsset });
      },

      setIsDragging: (isDragging) => {
        set({ isDragging });
      },

      getFilteredAssets: () => {
        const { assets, filterType, searchTerm } = get();
        return filterAssets(assets, filterType, searchTerm);
      },

      updateAssetCategory: async (id, category) => {
        const ext1Type = mapCategoryToExt1Type(category);
        const { assets } = get();
        const asset = assets.find((item) => item.id === id);

        let ext1Obj: Record<string, unknown> = {};
        if (asset?.ext1) {
          try {
            ext1Obj = JSON.parse(asset.ext1);
          } catch {
            ext1Obj = {};
          }
        }

        ext1Obj.type = ext1Type;

        try {
          await imageApi.put(id, { ext1: JSON.stringify(ext1Obj) });
          set((state) => ({
            assets: state.assets.map((item) =>
              item.id === id ? { ...item, ext1: JSON.stringify(ext1Obj) } : item
            ),
          }));
        } catch {
          set({ error: '更新分类失败，请重试' });
        }
      },

      syncVariants: async () => {
        const { assets } = get();
        const updatedAssets: Image[] = [];
        let count = 0;

        for (const asset of assets) {
          const resourceName = asset.name || asset.resourceName || '';
          if (!resourceName.includes(' - ') || !asset.id) {
            continue;
          }

          const parentName = resourceName.split(' - ')[0].trim();
          let ext1Obj: Record<string, unknown> = {};
          try {
            if (asset.ext1) {
              ext1Obj = JSON.parse(asset.ext1);
            }
          } catch {
            ext1Obj = {};
          }

          ext1Obj.parent = parentName;

          const parentAsset = assets.find((item) => (item.name || item.resourceName) === parentName);
          if (parentAsset?.ext1) {
            try {
              const parentExt1 = JSON.parse(parentAsset.ext1);
              ext1Obj.type = parentExt1.type || 'prop_secondary';
            } catch {
              // Ignore malformed ext1 from parent assets.
            }
          }

          try {
            await imageApi.put(asset.id, { ext1: JSON.stringify(ext1Obj) });
            updatedAssets.push({ ...asset, ext1: JSON.stringify(ext1Obj) });
            count += 1;
          } catch {
            // Ignore individual variant sync failures.
          }
        }

        if (updatedAssets.length > 0) {
          set((state) => ({
            assets: state.assets.map((asset) => updatedAssets.find((item) => item.id === asset.id) || asset),
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
