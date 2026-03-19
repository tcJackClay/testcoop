import { useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Home } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useAssetStore } from '../../stores';

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
  const { undo, redo, undoStack, redoStack, selectedNodeIds, deleteSelectedNodes, addNode, nodes } = useCanvasStore();
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

  // Calculate canvas center position for new node
  const getCanvasCenterPosition = () => {
    if (nodes.length === 0) {
      return { x: 100, y: 100 };
    }
    const maxX = Math.max(...nodes.map(n => n.position.x + (n.width || 200)));
    const maxY = Math.max(...nodes.map(n => n.position.y + (n.height || 100)));
    return { x: maxX + 50, y: maxY };
  };

  // Handle variant button click - create asset node with variant info
  const handleVariantClick = (variant: typeof assets[0]) => {
    const position = getCanvasCenterPosition();
    const variantImageUrl = variant.url || variant.resourceContent || '';
    
    addNode('createAsset', position, {
      data: {
        name: variant.name || variant.resourceName || assetName,
        imageUrl: variantImageUrl,
        assetType: variant.resourceType || selectedAsset?.resourceType || 'character_primary',
        isVariant: true,
        parentAssetId: selectedAssetId,
      },
    });
    console.log('Created asset node from variant:', variant.name);
  };

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
                    onClick={() => handleVariantClick(variant)}
                    className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 transition-colors"
                    title={`点击创建资产节点: ${variant.name}`}
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
        
        {/* 缩放控制 */}
        <div className="flex items-center gap-1 ml-2 border-l border-gray-700 pl-2">
          <button
            onClick={() => {
              const rect = document.body.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const worldX = (centerX - viewPort.x) / viewPort.zoom;
              const worldY = (centerY - viewPort.y) / viewPort.zoom;
              const newZoom = Math.max(viewPort.zoom / 1.2, 0.1);
              const x = centerX - worldX * newZoom;
              const y = centerY - worldY * newZoom;
              useCanvasStore.getState().updateViewPort({ x, y, zoom: newZoom });
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs text-gray-400 min-w-[40px] text-center">
            {Math.round(viewPort.zoom * 100)}%
          </span>
          
          <button
            onClick={() => {
              const rect = document.body.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const worldX = (centerX - viewPort.x) / viewPort.zoom;
              const worldY = (centerY - viewPort.y) / viewPort.zoom;
              const newZoom = Math.min(viewPort.zoom * 1.2, 3);
              const x = centerX - worldX * newZoom;
              const y = centerY - worldY * newZoom;
              useCanvasStore.getState().updateViewPort({ x, y, zoom: newZoom });
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              const nodes = useCanvasStore.getState().nodes;
              if (nodes.length === 0) {
                useCanvasStore.getState().updateViewPort({ x: 0, y: 0, zoom: 1 });
                return;
              }
              const rect = document.body.getBoundingClientRect();
              const padding = 50;
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              nodes.forEach(node => {
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                maxX = Math.max(maxX, node.position.x + (node.width || 200));
                maxY = Math.max(maxY, node.position.y + (node.height || 120));
              });
              const contentWidth = maxX - minX;
              const contentHeight = maxY - minY;
              const canvasWidth = rect.width - padding * 2;
              const canvasHeight = rect.height - padding * 2;
              const zoom = Math.min(canvasWidth / contentWidth, canvasHeight / contentHeight, 1.5);
              const centerX = (minX + maxX) / 2;
              const centerY = (minY + maxY) / 2;
              const x = rect.width / 2 - centerX * zoom;
              const y = rect.height / 2 - centerY * zoom;
              useCanvasStore.getState().updateViewPort({ x, y, zoom });
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="适应窗口"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => useCanvasStore.getState().updateViewPort({ x: 0, y: 0, zoom: 1 })}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="回到原点"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
