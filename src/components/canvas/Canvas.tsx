import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2,
  Grid3X3,
  Undo2,
  Redo2,
  MousePointer2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore } from '../../stores/canvasStore';
import NodeRenderer from '../nodes/NodeRenderer';
import ConnectionLine from '../nodes/ConnectionLine';

export default function Canvas() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const { 
    nodes, 
    connections,
    viewPort,
    addNode,
    updateViewPort,
    deleteSelectedNodes,
    selectedNodeIds,
    undo,
    redo,
    undoStack,
    redoStack,
    selectNodesInBox,
    clearSelection
  } = useCanvasStore();

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    updateViewPort({ zoom: newZoom });
  }, [viewPort.zoom, updateViewPort]);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Left click for panning
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewPort.x, y: e.clientY - viewPort.y });
    } else if (e.button === 0 && e.target === containerRef.current) {
      // Left click on canvas for selection box
      clearSelection();
      setIsSelecting(true);
      setSelectionStart({ x: e.clientX, y: e.clientY });
      setSelectionBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
    }
  }, [viewPort.x, viewPort.y, clearSelection]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      updateViewPort({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isSelecting) {
      const x = Math.min(e.clientX, selectionStart.x);
      const y = Math.min(e.clientY, selectionStart.y);
      const width = Math.abs(e.clientX - selectionStart.x);
      const height = Math.abs(e.clientY - selectionStart.y);
      setSelectionBox({ x, y, width, height });
    }
  }, [isPanning, isSelecting, panStart, selectionStart, updateViewPort]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      selectNodesInBox(selectionBox);
    }
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
  }, [isSelecting, selectionBox, selectNodesInBox]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/reactflow');
    if (nodeType && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const y = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      addNode(nodeType as any, { x, y });
    }
  }, [addNode, viewPort]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl + Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Delete selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0 && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          deleteSelectedNodes();
        }
      }
      // Escape to clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, deleteSelectedNodes, undo, redo, clearSelection]);

  const handleZoomIn = () => updateViewPort({ zoom: Math.min(viewPort.zoom * 1.2, 3) });
  const handleZoomOut = () => updateViewPort({ zoom: Math.max(viewPort.zoom / 1.2, 0.1) });
  const handleFitView = () => updateViewPort({ x: 0, y: 0, zoom: 1 });

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title={t('canvas.zoomIn')}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title={t('canvas.zoomOut')}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
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
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
              title={t('canvas.deleteNode')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden canvas-grid"
        style={{ cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : 'default' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          className="absolute inset-0 origin-top-left canvas-content"
          style={{
            transform: `translate(${viewPort.x}px, ${viewPort.y}px) scale(${viewPort.zoom})`,
          }}
        >
          {/* Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((conn) => (
              <ConnectionLine
                key={conn.id}
                connection={conn}
                nodes={nodes}
              />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <NodeRenderer key={node.id} node={node} />
          ))}
        </div>

        {/* Selection Box */}
        {selectionBox && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <Grid3X3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('canvas.addNode')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
