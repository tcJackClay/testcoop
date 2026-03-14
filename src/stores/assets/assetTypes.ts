// src/stores/assets/assetTypes.ts - 资产类型定义
import { Image } from '../../api/image';

export type AssetCategory = 'all' | '主要角色' | '次要角色' | '主要场景' | '次要场景' | '主要道具' | '次要道具';

export interface AssetWithVariants extends Image {
  variants?: Image[];
  parentId?: string;
}

export interface AssetState {
  assets: Image[];
  selectedAssetId: number | null;
  filterType: AssetCategory;
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
  draggedAsset: Image | null;
  isDragging: boolean;
}

export interface AssetActions {
  fetchAssets: () => Promise<void>;
  addAsset: (asset: Image) => void;
  updateAsset: (id: number, updates: Partial<Image>) => void;
  deleteAsset: (id: number) => Promise<void>;
  selectAsset: (id: number | null) => void;
  setFilterType: (type: AssetCategory) => void;
  setSearchTerm: (term: string) => void;
  setDraggedAsset: (asset: Image | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  getFilteredAssets: () => Image[];
  updateAssetCategory: (id: number, category: string) => Promise<void>;
  syncVariants: () => Promise<number>;
}

export type AssetStore = AssetState & AssetActions;
