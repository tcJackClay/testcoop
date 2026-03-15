import { useRef, useState, useCallback, useEffect } from 'react';
import { Grid3X3, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore, type NodeType } from '../../stores/canvasStore';
import NodeRenderer from '../nodes/NodeRenderer';
import CanvasToolbar from './CanvasToolbar';
import CanvasContextMenu from './CanvasContextMenu';
import { useCanvasConnections } from './useCanvasConnections';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
}

export default function Canvas() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0 });
  
  const { 
    nodes, viewPort, addNode, updateViewPort,
    deleteSelectedNodes, selectedNodeIds, undo, redo,
    selectNodesInBox, clearSelection, copyNodes, pasteNodes
  } = useCanvasStore();

  // 使用连线 hook (Tapnow 风格)
  const {
    connectingSource,
    connectingTarget,
    connectingInputType,
    mousePos,
    onSourceMouseDown,
    onTargetMouseDown,
    onNodeMouseUp,
    onDeleteConnection,
    onCanvasMouseMove,
    onCanvasClick,
    onCanvasMouseDown,
    ConnectionRenderer,
  } = useCanvasConnections({
    containerRef,
    viewPort,
  });


  // 滚轮缩放
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    updateViewPort({ zoom: newZoom });
  }, [viewPort.zoom, updateViewPort]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    element.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => element.removeEventListener('wheel', handleWheelNative);
  }, [handleWheelNative]);

  // 缩放控制
  const handleZoomIn = useCallback(() => updateViewPort({ zoom: Math.min(viewPort.zoom * 1.2, 3) }), [viewPort.zoom, updateViewPort]);
  const handleZoomOut = useCallback(() => updateViewPort({ zoom: Math.max(viewPort.zoom / 1.2, 0.1) }), [viewPort.zoom, updateViewPort]);
  const handleFitView = useCallback(() => updateViewPort({ x: 0, y: 0, zoom: 1 }), [updateViewPort]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    updateViewPort({ zoom: newZoom });
  }, [viewPort.zoom, updateViewPort]);

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const worldY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, worldX, worldY });
    }
  }, [viewPort.x, viewPort.y, viewPort.zoom]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('canvas-content')) return;
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const worldY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, worldX, worldY });
    }
  }, [viewPort.x, viewPort.y, viewPort.zoom]);

  const closeContextMenu = useCallback(() => setContextMenu(prev => ({ ...prev, visible: false })), []);
  
  const handleAddNodeFromContextMenu = useCallback((type: NodeType) => {
    addNode(type, { x: contextMenu.worldX, y: contextMenu.worldY });
    closeContextMenu();
  }, [addNode, contextMenu.worldX, contextMenu.worldY, closeContextMenu]);

  // 鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 使用连线 hook 的处理
    onCanvasMouseDown(e);
    
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);

    if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearSelection();
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionBox({ x, y, width: 0, height: 0 });
      return;
    }

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewPort.x, y: e.clientY - viewPort.y });
    } else if (e.button === 0 && e.target === containerRef.current) {
      clearSelection();
    }
  }, [viewPort.x, viewPort.y, clearSelection, onCanvasMouseDown]);

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 使用连线 hook 的处理（更新预览位置）
    onCanvasMouseMove(e);
    
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);

    if (isPanning) {
      updateViewPort({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (isSelecting) {
      const selX = Math.min(x, selectionStart.x);
      const selY = Math.min(y, selectionStart.y);
      const width = Math.abs(x - selectionStart.x);
      const height = Math.abs(y - selectionStart.y);
      setSelectionBox({ x: selX, y: selY, width, height });
    }
  }, [isPanning, isSelecting, panStart, selectionStart, updateViewPort, onCanvasMouseMove]);

  // 鼠标松开
  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      selectNodesInBox(selectionBox);
    }
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
  }, [isSelecting, selectionBox, selectNodesInBox]);
  
  // 拖放
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const assetData = e.dataTransfer.getData('application/json');
    if (assetData && containerRef.current) {
      try {
        const asset = JSON.parse(assetData);
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
        const y = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
        
        // 获取图片 URL - 优先使用 resourceContent (base64)
        const imageUrl = asset.resourceContent || asset.imageUrl || asset.url || '';
        
        // 解析处理链信息 - 需要逐个从后端加载追溯完整链条
        const processChain = asset.ext2 ? JSON.parse(asset.ext2) : [];
        
        console.log('[Canvas] 拖放资产:', asset.name, 'ext2:', asset.ext2, 'processChain:', processChain);
        
        // 如果有生成历史，追溯完整生成链
        if (processChain.length > 0) {
          const chain: Array<{ id: number; type: string; processType: string }> = [];
          const processedIds = new Set<number>();
          
          // 从当前资产开始
          let currentId = asset.id!;
          chain.push({ id: currentId, type: '原始图片', processType: '' });
          processedIds.add(currentId);
          
          // 异步递归追溯链条
          const traceChain = async (startId: number): Promise<void> => {
            // 从资产列表中找到 startId 对应的资产
            const { imageApi } = await import('../../api/image');
            const allImages = await imageApi.getAll(1024);
            
            let checkId = startId;
            let found = true;
            
            while (found) {
              found = false;
              
              // 找到当前资产的 ext2
              const currentAsset = allImages.find((img: any) => img.id === checkId);
              if (currentAsset?.ext2) {
                const currentChain = JSON.parse(currentAsset.ext2);
                
                for (const record of currentChain) {
                  if (record.sourceId === checkId && !processedIds.has(record.targetId)) {
                    chain.push({
                      id: record.targetId,
                      type: record.type,
                      processType: record.type
                    });
                    processedIds.add(record.targetId);
                    checkId = record.targetId;
                    found = true;
                    break;
                  }
                }
              }
            }
          };
          
          // 执行追溯
          traceChain(currentId).then(() => {
            console.log('[Canvas] 生成链:', chain);
            
            // 创建节点
            chain.forEach((node, index) => {
              const row = Math.floor(index / 3);
              const col = index % 3;
              const nodeX = x + col * 320;
              const nodeY = y + row * 280;
              
              addNode('imageNode', { x: nodeX, y: nodeY }, {
                data: {
                  imageUrl: node.id?.toString() || '',
                  assetId: node.id,
                  label: node.type === '原始图片' ? (asset.name || '原始图片') : `${asset.name}-${node.type}`,
                  status: 'completed',
                  processInfo: node.type === '原始图片' ? '原始图片' : node.processType,
                }
              });
            });
          });
        } else {
          addNode('imageNode', { x, y }, {
            data: {
              imageUrl: asset.id?.toString() || '',
              assetId: asset.id,
              label: asset.name || asset.resourceName || 'Asset',
            }
          });
        }
        return;
      } catch (err) {
        console.error('解析资产数据失败:', err);
      }
    }
    
    const nodeType = e.dataTransfer.getData('application/reactflow');
    if (nodeType && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const y = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      addNode(nodeType as NodeType, { x, y });
    }
  }, [addNode, viewPort.x, viewPort.y, viewPort.zoom]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copyNodes(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteNodes(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0 && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          deleteSelectedNodes();
        }
      }
      if (e.key === 'Escape') {
        clearSelection();
        onCanvasClick(); // 取消连线
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, deleteSelectedNodes, undo, redo, clearSelection, copyNodes, pasteNodes, onCanvasClick]);

  useEffect(() => {
    if (contextMenu.visible) {
      const handleClick = () => closeContextMenu();
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible, closeContextMenu]);

  return (
    <div className="h-full flex flex-col">
      <CanvasToolbar viewPort={viewPort} />

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden canvas-grid"
        style={{ cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : connectingSource ? 'crosshair' : 'default' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onClick={onCanvasClick}
      >
        <div
          className="absolute inset-0 origin-top-left canvas-content"
          style={{ transform: `translate(${viewPort.x}px, ${viewPort.y}px) scale(${viewPort.zoom})` }}
        >
          {/* 连线渲染器 */}
          <ConnectionRenderer />

          {nodes.map((node) => (
            <NodeRenderer 
              key={node.id} 
              node={node} 
              connectingSource={connectingSource}
              connectingTarget={connectingTarget}
              connectingInputType={connectingInputType}
              mousePos={mousePos}
              onSourceMouseDown={onSourceMouseDown}
              onTargetMouseDown={onTargetMouseDown}
              onNodeMouseUp={onNodeMouseUp}
              onDeleteConnection={onDeleteConnection}
            />
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
              <Grid3X3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('canvas.addNode')}</p>
              <p className="text-xs mt-1">双击或右键点击添加节点</p>
              <p className="text-xs mt-1">拖拽节点连接点进行连线</p>
            </div>
          </div>
        )}

        <CanvasContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          worldX={contextMenu.worldX}
          worldY={contextMenu.worldY}
          onAddNode={handleAddNodeFromContextMenu}
          onClose={closeContextMenu}
        />

        {/* Zoom Controls - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 py-1 bg-gray-800/80 rounded text-xs text-gray-400 min-w-[50px] text-center">
            {Math.round(viewPort.zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 ml-1"
            title="适应视图"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
