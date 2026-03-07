import { useState, useCallback, RefObject, useMemo } from 'react';
import { 
  Image, Video, FileText, BookOpen, Wand2, Film, Eye, HardDrive, GitCompare, Sparkles, Clapperboard, Users, Mountain
} from 'lucide-react';
import { useCanvasStore, type NodeType } from '../../stores/canvasStore';
import NodeRenderer from '../nodes/NodeRenderer';
import ConnectionLine from '../nodes/ConnectionLine';
import CanvasToolbar from './CanvasToolbar';
import { useCanvasEvents } from './useCanvasEvents';

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
  const containerRef: RefObject<HTMLDivElement> = useState(null)[0] as unknown as RefObject<HTMLDivElement>;
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0 });
  
  const { 
    nodes, connections, viewPort, addNode, updateViewPort, 
    deleteSelectedNodes, selectedNodeIds, selectNodesInBox, clearSelection 
  } = useCanvasStore();

  const { handleContextMenu, handleDoubleClick, handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasEvents({
    containerRef,
    viewPort,
    isPanning,
    isSelecting,
    selectionBox,
    selectionStart,
    panStart,
    setIsPanning,
    setIsSelecting,
    setSelectionBox,
    setSelectionStart,
    setContextMenu,
    clearSelection,
    updateViewPort,
    selectNodesInBox,
  });

  // Toolbar handlers
  const handleZoomIn = useCallback(() => updateViewPort({ zoom: Math.min(viewPort.zoom * 1.2, 3) }), [viewPort.zoom, updateViewPort]);
  const handleZoomOut = useCallback(() => updateViewPort({ zoom: Math.max(viewPort.zoom / 1.2, 0.1) }), [viewPort.zoom, updateViewPort]);
  const handleFitView = useCallback(() => updateViewPort({ x: 0, y: 0, zoom: 1 }), [updateViewPort]);

  // Context menu handlers
  const closeContextMenu = useCallback(() => setContextMenu(prev => ({ ...prev, visible: false })), []);
  const handleAddNodeFromContextMenu = useCallback((type: NodeType) => {
    addNode(type, { x: contextMenu.worldX, y: contextMenu.worldY });
    closeContextMenu();
  }, [addNode, contextMenu.worldX, contextMenu.worldY, closeContextMenu]);

  // Close context menu on click outside
  useMemo(() => {
    if (contextMenu.visible) {
      const handleClick = () => closeContextMenu();
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible, closeContextMenu]);

  return (
    <div className="h-full flex flex-col">
      <CanvasToolbar 
        viewPort={viewPort}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
      />

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden canvas-grid"
        style={{ cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="absolute inset-0 origin-top-left canvas-content"
          style={{ transform: `translate(${viewPort.x}px, ${viewPort.y}px) scale(${viewPort.zoom})` }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((conn) => (
              <ConnectionLine key={conn.id} connection={conn} nodes={nodes} />
            ))}
          </svg>
          {nodes.map((node) => (
            <NodeRenderer key={node.id} node={node} />
          ))}
        </div>

        {selectionBox && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
            style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }}
          />
        )}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-2 opacity-50 bg-current rounded" style={{ mask: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>\')', WebkitMask: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>\')' }} />
              <p>双击或右键点击添加节点</p>
            </div>
          </div>
        )}

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
