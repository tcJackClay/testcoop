import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Undo2, Redo2 } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useAssetStore } from '../../stores/assetStore';

interface CanvasToolbarProps {
  viewPort: { x: number; y: number; zoom: number };
}

// Extract variant display name by removing the parent asset name prefix
// e.g., "九转印行 - 夜晚闭店状态" -> "夜晚闭店状态"
const getVariantDisplayName = (variantName: string, parentName: string): string => {
  if (!variantName || !parentName) return variantName || '';
  
  const separators = [' - ', ' — ', ' - ', ' _ ', '：', ':'];
  for (const sep of separators) {
    const fullPattern = `${parentName}${sep}`;
    if (variantName.startsWith(fullPattern)) {
      return variantName.slice(fullPattern.length);
    }
  }
  return variantName;
};

export default function CanvasToolbar({ viewPort }: CanvasToolbarProps) {
  const { t } = useTranslation();
  const { undo, redo, undoStack, redoStack, selectedNodeIds, deleteSelectedNodes } = useCanvasStore();
  const { assets, fetchAssets, selectedAssetId } = useAssetStore((state) => ({ 
    assets: state.assets, 
    fetchAssets: state.fetchAssets,
    selectedAssetId: state.selectedAssetId 
  }));

  // Ensure assets are loaded when toolbar mounts
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Get selected asset from assetStore
  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    return assets.find((asset) => asset.id === selectedAssetId) || null;
  }, [selectedAssetId, assets]);

  // Get asset name
  const assetName = selectedAsset?.name || selectedAsset?.resourceName || '';

  // Get variants for this asset (assets with same parent)
  const variants = useMemo(() => {
    if (!assetName) return [];
    return assets.filter((asset) => {
      const ext1 = asset.ext1;
      if (ext1 && ext1.startsWith('{')) {
        try {
          const parsed = JSON.parse(ext1);
          return parsed.parent === assetName;
        } catch {
          return false;
        }
      }
      return false;
    });
  }, [assetName, assets]);

  return (
    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        {/* Selected Asset Info */}
        {selectedAsset ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 font-medium">{assetName}</span>
            {variants.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">(</span>
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 transition-colors"
                    title={`变体: ${variant.name}`}
                  >
                    {getVariantDisplayName(variant.name || variant.resourceName || '', assetName)}
                  </button>
                ))}
                <span className="text-xs text-gray-500">)</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-500">画布</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className={`p-1.5 rounded ${
            undoStack.length > 0 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title={t('canvas.undo')}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className={`p-1.5 rounded ${
            redoStack.length > 0 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title={t('canvas.redo')}
        >
          <Redo2 className="w-4 h-4" />
        </button>
        {selectedNodeIds.length > 0 && (
          <button
            onClick={deleteSelectedNodes}
            className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-500/20"
            title={t('canvas.deleteNode')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
