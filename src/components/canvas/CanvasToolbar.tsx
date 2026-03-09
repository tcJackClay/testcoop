import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Undo2, Redo2 } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useAssetStore } from '../../stores/assetStore';

interface CanvasToolbarProps {
  viewPort: { x: number; y: number; zoom: number };
}

export default function CanvasToolbar({ viewPort }: CanvasToolbarProps) {
  const { t } = useTranslation();
  const { undo, redo, undoStack, redoStack, selectedNodeIds, deleteSelectedNodes, nodes, updateNode } = useCanvasStore();
  const assets = useAssetStore((state) => state.assets);

  // Get selected node info
  const selectedNode = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null;
    return nodes.find((node) => node.id === selectedNodeIds[0]) || null;
  }, [selectedNodeIds, nodes]);

  // Check if selected node is a CreateAssetNode
  const isAssetNode = selectedNode?.type === 'createAsset';
  
  // Get asset name from selected node
  const assetName = isAssetNode ? (selectedNode.data.name as string || '') : '';
  
  // Get variants for this asset
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

  // Handle variant button click - update the node's image to show the variant
  const handleVariantClick = (variant: typeof assets[0]) => {
    if (!selectedNode) return;
    
    const variantImageUrl = variant.resourceContent || variant.url;
    if (variantImageUrl) {
      // Update the selected node with the variant's image
      updateNode(selectedNode.id, { data: { ...selectedNode.data, imageUrl: variantImageUrl } });
      console.log('切换到变体:', variant.name);
    }
  };

  return (
    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        {/* Selected Asset Info */}
        {isAssetNode && assetName ? (
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
                    title={`点击切换到变体: ${variant.name}`}
                  >
                    {variant.name}
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
