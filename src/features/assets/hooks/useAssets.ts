// src/features/assets/hooks/useAssets.ts - 资产操作逻辑
import { useCallback } from 'react';
import { useAssetStore } from '../../../stores';
import { mapCategoryToExt1Type } from '../AssetLibraryPanel.types';

// 资产分类映射
export { mapCategoryToExt1Type };

// 资产操作 Hook
export const useAssetActions = () => {
  const {
    fetchAssets,
    updateAssetCategory,
    deleteAsset,
    selectAsset,
    setFilterType,
    setSearchTerm,
    getFilteredAssets,
  } = useAssetStore();

  // 更新资产分类
  const handleCategoryChange = useCallback(async (assetId: number, category: string) => {
    await updateAssetCategory(assetId, category);
  }, [updateAssetCategory]);

  // 删除资产
  const handleDelete = useCallback(async (assetId: number) => {
    await deleteAsset(assetId);
  }, [deleteAsset]);

  // 搜索资产
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, [setSearchTerm]);

  // 筛选资产
  const handleFilter = useCallback((type: string) => {
    setFilterType(type as any);
  }, [setFilterType]);

  return {
    fetchAssets,
    handleCategoryChange,
    handleDelete,
    handleSearch,
    handleFilter,
    selectAsset,
    getFilteredAssets,
    assets: useAssetStore(state => state.assets),
    filterType: useAssetStore(state => state.filterType),
    searchTerm: useAssetStore(state => state.searchTerm),
    isLoading: useAssetStore(state => state.isLoading),
  };
};
