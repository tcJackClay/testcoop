import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2,
  Grid3X3
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore } from '../../stores/canvasStore';
import NodeRenderer from '../nodes/NodeRenderer';
import ConnectionLine from '../nodes/ConnectionLine';

interface CanvasProps {
  // Props will be extended
}

export default function Canvas({}: CanvasProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const { 
    nodes, 
    connections,
    viewPort,
    addNode,
    updateViewPort,
    deleteSelectedNodes,
    selectedNodeIds
  } = useCanvasStore();

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    updateViewPort({ zoom: newZoom });
  }, [viewPort.zoom, updateViewPort]);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewPort.x, y: e.clientY - viewPort.y });
    }
  }, [viewPort.x, viewPort.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      updateViewPort({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, updateViewPort]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/reactflow');
    if (nodeType && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const y = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      addNode(nodeType, { x, y });
    }
  }, [addNode, viewPort]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0) {
          deleteSelectedNodes();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, deleteSelectedNodes]);

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
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          className="absolute inset-0 origin-top-left"
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
