// src/components/nodes/CreateAssetNode/hooks/useCreateAsset.ts - 创建资产逻辑
import { useState, useCallback } from 'react';
import { imageApi } from '../../../api/image';
import { useProjectStore, useAssetStore } from '../../../stores';
import { AssetTypeOption } from '../types';

// 资产类型选项
export const ASSET_TYPE_OPTIONS: AssetTypeOption[] = [
  { value: 'character_primary', label: '主要角色', color: 'blue' },
  { value: 'character_secondary', label: '次要角色', color: 'blue' },
  { value: 'scene_primary', label: '主要场景', color: 'green' },
  { value: 'scene_secondary', label: '次要场景', color: 'green' },
  { value: 'prop_primary', label: '主要道具', color: 'orange' },
  { value: 'prop_secondary', label: '次要道具', color: 'orange' },
];

export const useCreateAsset = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { currentProjectId } = useProjectStore();
  const { addAsset } = useAssetStore();

  // 创建资产
  const createAsset = useCallback(async (data: {
    name: string;
    imageUrl: string;
    category: string;
    description?: string;
    isVariant?: boolean;
    parentAssetId?: number;
  }) => {
    if (!currentProjectId) {
      setError('请先选择项目');
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      // 构建 ext1 JSON
      const ext1Json: Record<string, unknown> = {
        type: data.category,
      };
      
      if (data.isVariant && data.parentAssetId) {
        ext1Json.parent = data.parentAssetId;
        ext1Json.variant = true;
      }

      const response = await imageApi.create({
        projectId: currentProjectId,
        resourceName: data.name,
        resourceContent: data.imageUrl,
        resourceType: 'image',
        resourceStatus: 'official',
        ext1: JSON.stringify(ext1Json),
      });

      if (response.code === 0 && response.data) {
        addAsset(response.data);
        return response.data;
      } else {
        setError(response.message || '创建失败');
        return null;
      }
    } catch (err) {
      setError('创建资产失败');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [currentProjectId, addAsset]);

  return {
    createAsset,
    isCreating,
    error,
    setError,
    assetTypeOptions: ASSET_TYPE_OPTIONS,
  };
};
