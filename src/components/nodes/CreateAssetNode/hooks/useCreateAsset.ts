import { useCallback, useState } from 'react';
import { imageApi } from '../../../../api/image';
import { useAssetStore, useProjectStore } from '../../../../stores';
import type { AssetTypeOption } from '../types';

export const ASSET_TYPE_OPTIONS: AssetTypeOption[] = [
  { value: 'character_primary', label: '涓昏瑙掕壊', color: 'blue' },
  { value: 'character_secondary', label: '娆¤瑙掕壊', color: 'blue' },
  { value: 'scene_primary', label: '涓昏鍦烘櫙', color: 'green' },
  { value: 'scene_secondary', label: '娆¤鍦烘櫙', color: 'green' },
  { value: 'prop_primary', label: '涓昏閬撳叿', color: 'orange' },
  { value: 'prop_secondary', label: '娆¤閬撳叿', color: 'orange' },
];

export const useCreateAsset = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentProjectId } = useProjectStore();
  const { addAsset } = useAssetStore();

  const createAsset = useCallback(
    async (data: {
      name: string;
      imageUrl: string;
      category: string;
      description?: string;
      isVariant?: boolean;
      parentAssetId?: number;
    }) => {
      if (!currentProjectId) {
        setError('璇峰厛閫夋嫨椤圭洰');
        return null;
      }

      setIsCreating(true);
      setError(null);

      try {
        const ext1Json: Record<string, unknown> = {
          type: data.category,
        };

        if (data.isVariant && data.parentAssetId) {
          ext1Json.parent = data.parentAssetId;
          ext1Json.variant = true;
        }

        const asset = await imageApi.create({
          projectId: currentProjectId,
          resourceName: data.name,
          resourceContent: data.imageUrl,
          resourceType: 'image',
          resourceStatus: 'official',
          ext1: JSON.stringify(ext1Json),
        });

        if (!asset) {
          setError('鍒涘缓澶辫触');
          return null;
        }

        addAsset(asset);
        return asset;
      } catch {
        setError('鍒涘缓璧勪骇澶辫触');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [addAsset, currentProjectId]
  );

  return {
    createAsset,
    isCreating,
    error,
    setError,
    assetTypeOptions: ASSET_TYPE_OPTIONS,
  };
};
