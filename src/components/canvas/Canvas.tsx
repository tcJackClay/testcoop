import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2,
  Grid3X3,
  Undo2,
  Redo2,
  Image,
  Video,
  FileText,
  BookOpen,
  Wand2,
  Film,
  Eye,
  HardDrive,
  GitCompare,
  Sparkles,
  Clapperboard,
  Users,
  Mountain
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore, type NodeType } from '../../stores/canvasStore';
import NodeRenderer from '../nodes/NodeRenderer';
import ConnectionLine from '../nodes/ConnectionLine';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
}

interface ContextMenuItem {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
}

const nodeTypeItems: ContextMenuItem[] = [
  { type: 'imageInput', label: '图片输入', icon: <Image className="w-4 h-4" /> },
  { type: 'videoInput', label: '视频输入', icon: <Video className="w-4 h-4" /> },
  { type: 'textNode', label: '文字节点', icon: <FileText className="w-4 h-4" /> },
  { type: 'novelInput', label: '小说输入', icon: <BookOpen className="w-4 h-4" /> },
  { type: 'aiImage', label: 'AI 绘图', icon: <Wand2 className="w-4 h-4" /> },
  { type: 'aiVideo', label: 'AI 视频', icon: <Film className="w-4 h-4" /> },
  { type: 'storyboardNode', label: '智能分镜', icon: <Clapperboard className="w-4 h-4" /> },
  { type: 'videoAnalyze', label: '视频拆解', icon: <Sparkles className="w-4 h-4" /> },
  { type: 'characterDescription', label: '角色描述', icon: <Users className="w-4 h-4" /> },
  { type: 'sceneDescription', label: '场景描述', icon: <Mountain className="w-4 h-4" /> },
  { type: 'imageCompare', label: '图像对比', icon: <GitCompare className="w-4 h-4" /> },
  { type: 'preview', label: '预览窗口', icon: <Eye className="w-4 h-4" /> },
  { type: 'saveLocal', label: '保存到本地', icon: <HardDrive className="w-4 h-4" /> },
];

export default function Canvas() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
  });
  
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

  // Handle wheel zoom with passive: false to allow preventDefault
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    updateViewPort({ zoom: newZoom });
  }, [viewPort.zoom, updateViewPort]);

  // Attach wheel event listener with passive: false
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    element.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => element.removeEventListener('wheel', handleWheelNative);
  }, [handleWheelNative]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    updateViewPort({ zoom: newZoom });
  }, [viewPort.zoom, updateViewPort]);

  // Handle context menu (right-click)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const worldY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        worldX,
        worldY,
      });
    }
  }, [viewPort.x, viewPort.y, viewPort.zoom]);

  // Handle double-click (same as right-click - show context menu)
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Only trigger on the canvas background, not on nodes
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('canvas-content')) {
      return;
    }
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const worldY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        worldX,
        worldY,
      });
    }
  }, [viewPort.x, viewPort.y, viewPort.zoom]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const handleAddNodeFromContextMenu = useCallback((type: NodeType) => {
    addNode(type, { x: contextMenu.worldX, y: contextMenu.worldY });
    closeContextMenu();
  }, [addNode, contextMenu.worldX, contextMenu.worldY, closeContextMenu]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu.visible) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible, closeContextMenu]);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewPort.x, y: e.clientY - viewPort.y });
    } else if (e.button === 0 && e.target === containerRef.current) {
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
      addNode(nodeType as NodeType, { x, y });
    }
  }, [addNode, viewPort]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0 && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          deleteSelectedNodes();
        }
      }
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
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
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
              <p className="text-xs mt-1">双击或右键点击添加节点</p>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            className="fixed z-50 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {nodeTypeItems.map((item) => (
              <button
                key={item.type}
                onClick={() => handleAddNodeFromContextMenu(item.type)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
