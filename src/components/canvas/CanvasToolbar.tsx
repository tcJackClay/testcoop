import { useMemo, useEffect } from 'react';
import { Trash2, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Home, Sparkles } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useAssetStore } from '../../stores';

interface CanvasToolbarProps {
  viewPort: { x: number; y: number; zoom: number };
}

const getVariantDisplayName = (variantName: string, parentName: string): string => {
  if (!variantName || !parentName) return variantName || '';

  const separators = [' - ', ' — ', ' _ ', '：', ':'];
  for (const sep of separators) {
    const fullPattern = `${parentName}${sep}`;
    if (variantName.startsWith(fullPattern)) {
      return variantName.slice(fullPattern.length);
    }
  }
  return variantName;
};

const iconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-[var(--text-secondary)] transition hover:border-[var(--border-soft)] hover:bg-white/8 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:text-[var(--text-tertiary)]';

export default function CanvasToolbar({ viewPort }: CanvasToolbarProps) {
  const { undo, redo, undoStack, redoStack, selectedNodeIds, deleteSelectedNodes, addNode, nodes } = useCanvasStore();
  const { assets, fetchAssets, selectedAssetId } = useAssetStore((state) => ({
    assets: state.assets,
    fetchAssets: state.fetchAssets,
    selectedAssetId: state.selectedAssetId,
  }));

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    return assets.find((asset) => asset.id === selectedAssetId) || null;
  }, [selectedAssetId, assets]);

  const assetName = selectedAsset?.name || selectedAsset?.resourceName || '';

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

  const getCanvasCenterPosition = () => {
    if (nodes.length === 0) {
      return { x: 100, y: 100 };
    }
    const maxX = Math.max(...nodes.map((node) => node.position.x + (node.width || 200)));
    const maxY = Math.max(...nodes.map((node) => node.position.y + (node.height || 100)));
    return { x: maxX + 50, y: maxY };
  };

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
  };

  const updateViewPort = useCanvasStore.getState().updateViewPort;

  return (
    <div className="border-b border-[var(--border-soft)] bg-[color:rgba(17,22,29,0.82)] px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-white/5 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            <Sparkles size={12} />
            当前资产
          </div>

          {selectedAsset ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{assetName}</span>
              {variants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantClick(variant)}
                      className="rounded-full border border-primary-500/25 bg-primary-500/10 px-3 py-1 text-xs text-primary-300 transition hover:border-primary-500/40 hover:bg-primary-500/16 hover:text-primary-200"
                      title={`创建变体节点：${variant.name || variant.resourceName || ''}`}
                    >
                      {getVariantDisplayName(variant.name || variant.resourceName || '', assetName)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">未选中资产，可从左侧资产库拖入画布开始编排。</p>
          )}
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-soft)] bg-white/5 p-1">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className={iconButtonClass}
              title="撤销"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className={iconButtonClass}
              title="重做"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            {selectedNodeIds.length > 0 && (
              <button
                onClick={deleteSelectedNodes}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-sm text-red-300 transition hover:border-red-500/35 hover:bg-red-500/16 hover:text-red-200"
                title="删除选中节点"
              >
                <Trash2 className="h-4 w-4" />
                <span>删除</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-soft)] bg-white/5 p-1">
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
                updateViewPort({ x, y, zoom: newZoom });
              }}
              className={iconButtonClass}
              title="缩小"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <span className="min-w-[58px] px-2 text-center text-sm font-medium text-[var(--text-primary)]">
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
                updateViewPort({ x, y, zoom: newZoom });
              }}
              className={iconButtonClass}
              title="放大"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                const nextNodes = useCanvasStore.getState().nodes;
                if (nextNodes.length === 0) {
                  updateViewPort({ x: 0, y: 0, zoom: 1 });
                  return;
                }
                const rect = document.body.getBoundingClientRect();
                const padding = 50;
                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;
                nextNodes.forEach((node) => {
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
                updateViewPort({ x, y, zoom });
              }}
              className={iconButtonClass}
              title="适应视图"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => updateViewPort({ x: 0, y: 0, zoom: 1 })}
              className={iconButtonClass}
              title="回到原点"
            >
              <Home className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
