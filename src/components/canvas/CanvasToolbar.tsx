import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut, Maximize2, Trash2, Undo2, Redo2 } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface CanvasToolbarProps {
  viewPort: { x: number; y: number; zoom: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export default function CanvasToolbar({ viewPort, onZoomIn, onZoomOut, onFitView }: CanvasToolbarProps) {
  const { t } = useTranslation();
  const { undo, redo, undoStack, redoStack, selectedNodeIds, deleteSelectedNodes } = useCanvasStore();

  return (
    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomIn}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title={t('canvas.zoomIn')}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title={t('canvas.zoomOut')}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onFitView}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title={t('canvas.fitView')}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 ml-2">
          {Math.round(viewPort.zoom * 100)}%
        </span>
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
            className="p-1.5 text-red-400 hover:text-red-300900/30 rounded hover:bg-red-"
            title={t('canvas.deleteNode')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
