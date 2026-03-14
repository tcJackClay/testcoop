// src/components/nodes/CreateAssetNode/types.ts - 创建资产节点类型
export interface AssetTypeOption {
  value: string;
  label: string;
  color: string;
}

export interface CreateAssetFormData {
  name: string;
  description: string;
  category: string;
  isVariant: boolean;
  parentAssetId: number | null;
}

export interface CreateAssetNodeData {
  imageUrl?: string;
  assetId?: number;
  category?: string;
}
