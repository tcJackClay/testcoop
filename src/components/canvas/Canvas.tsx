import { useRef, useState, useCallback, useEffect } from 'react';
import { Grid3X3, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore, type NodeType } from '../../stores/canvasStore';
import NodeRenderer from '../nodes/NodeRenderer';
import CanvasToolbar from './CanvasToolbar';
import CanvasContextMenu from './CanvasContextMenu';
import { useCanvasConnections } from './useCanvasConnections';
import FlowLinesManager from './FlowLinesManager';

interface CanvasProps {
  leftPanelOpen?: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
}

export default function Canvas({ leftPanelOpen = false }: CanvasProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  
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

  // 资产流程线状态
  const [assetInfo, setAssetInfo] = useState<{ x: number; y: number; id: number; name: string; ext2?: string; assetData?: any } | null>(null);
  const [flowLineCount, setFlowLineCount] = useState(0);
  
  // 重复资产确认对话框状态
  const [duplicateAsset, setDuplicateAsset] = useState<{
    x: number; y: number; id: number; name: string; ext2?: string; assetData?: any;
    existingNodeId: string;
  } | null>(null);
  
  // 监听流程线数量变化后清空 assetInfo
  useEffect(() => {
    if (assetInfo && flowLineCount > 0) {
      console.log('[Canvas] 流程线创建完成，清空 assetInfo');
      setAssetInfo(null);
      setFlowLineCount(0);
    }
  }, [flowLineCount]);

  // 缩放状态提示
  const [zoomTip, setZoomTip] = useState<string | null>(null);

  // 滚轮缩放 - 以鼠标为中心
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 缩放前鼠标在世界坐标的位置
    const worldX = (mouseX - viewPort.x) / viewPort.zoom;
    const worldY = (mouseY - viewPort.y) / viewPort.zoom;
    
    // 计算新缩放
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    
    // 缩放后保持鼠标位置不变
    const newX = mouseX - worldX * newZoom;
    const newY = mouseY - worldY * newZoom;
    
    updateViewPort({ x: newX, y: newY, zoom: newZoom });
    
    // 显示缩放提示
    setZoomTip(`${Math.round(newZoom * 100)}%`);
    setTimeout(() => setZoomTip(null), 800);
  }, [viewPort.zoom, viewPort.x, viewPort.y, updateViewPort]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    element.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => element.removeEventListener('wheel', handleWheelNative);
  }, [handleWheelNative]);

  // 缩放控制 - 以画布中心为中心
  const handleZoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const worldX = (centerX - viewPort.x) / viewPort.zoom;
    const worldY = (centerY - viewPort.y) / viewPort.zoom;
    
    const newZoom = Math.min(viewPort.zoom * 1.2, 3);
    const newX = centerX - worldX * newZoom;
    const newY = centerY - worldY * newZoom;
    
    updateViewPort({ x: newX, y: newY, zoom: newZoom });
    setZoomTip(`${Math.round(newZoom * 100)}%`);
    setTimeout(() => setZoomTip(null), 800);
  }, [viewPort, updateViewPort]);

  const handleZoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const worldX = (centerX - viewPort.x) / viewPort.zoom;
    const worldY = (centerY - viewPort.y) / viewPort.zoom;
    
    const newZoom = Math.max(viewPort.zoom / 1.2, 0.1);
    const newX = centerX - worldX * newZoom;
    const newY = centerY - worldY * newZoom;
    
    updateViewPort({ x: newX, y: newY, zoom: newZoom });
    setZoomTip(`${Math.round(newZoom * 100)}%`);
    setTimeout(() => setZoomTip(null), 800);
  }, [viewPort, updateViewPort]);

  // 适应窗口 - 让所有节点适应画布
  const handleFitView = useCallback(() => {
    if (nodes.length === 0) {
      updateViewPort({ x: 0, y: 0, zoom: 1 });
      return;
    }
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 50;
    
    // 计算所有节点的边界
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
    
    updateViewPort({ x, y, zoom });
    setZoomTip(`${Math.round(zoom * 100)}%`);
    setTimeout(() => setZoomTip(null), 800);
  }, [nodes, updateViewPort]);

  // 回到原点
  const handleResetView = useCallback(() => {
    updateViewPort({ x: 0, y: 0, zoom: 1 });
    setZoomTip('100%');
    setTimeout(() => setZoomTip(null), 800);
  }, [updateViewPort]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // React 事件处理同上
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - viewPort.x) / viewPort.zoom;
    const worldY = (mouseY - viewPort.y) / viewPort.zoom;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    const newX = mouseX - worldX * newZoom;
    const newY = mouseY - worldY * newZoom;
    
    updateViewPort({ x: newX, y: newY, zoom: newZoom });
    setZoomTip(`${Math.round(newZoom * 100)}%`);
    setTimeout(() => setZoomTip(null), 800);
  }, [viewPort, updateViewPort]);

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
    // 双击空白处复位视图
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-content')) {
      e.preventDefault();
      handleResetView();
      return;
    }
    // 双击节点显示上下文菜单（保留原有功能）
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const worldY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, worldX, worldY });
    }
  }, [viewPort.x, viewPort.y, viewPort.zoom, handleResetView]);

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

    // 框选模式
    if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      // 不清除选中，让用户可以在已有选中基础上添加
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionBox({ x, y, width: 0, height: 0 });
      return;
    }

    // 平移模式：鼠标中键 或 Alt+左键 或 空格+左键
    if (e.button === 1 || (e.button === 0 && (e.altKey || e.shiftKey)) || (e.button === 0 && isSpacePressed)) {
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
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    const assetData = e.dataTransfer.getData('application/json');
    if (assetData && containerRef.current) {
      try {
        const asset = JSON.parse(assetData);
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
        const y = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
        
        // ========== 优化：先用资产卡携带的数据立即响应，后台异步获取最新 ==========
        
        // 优先使用资产卡携带的 ext2（不阻塞拖拽）
        const assetExt2 = asset.ext2 || null;
        
        // 解析处理链信息
        const processChain = assetExt2 ? JSON.parse(assetExt2) : [];
        
        console.log('[Canvas] 拖放资产:', asset.name, 'ext2:', assetExt2, 'processChain:', processChain);
        
        // ========== 检查画布是否已有该资产 ==========
        const existingNode = nodes.find(n => n.data?.assetId === asset.id);
        if (existingNode) {
          console.log('[Canvas] 画布已有该资产:', asset.name, 'existing node:', existingNode.id);
          // 弹出确认对话框
          setDuplicateAsset({
            x,
            y,
            id: asset.id,
            name: asset.name,
            ext2: assetExt2,
            assetData: asset,
            existingNodeId: existingNode.id,
          });
          return;
        }
        
        // 如果有生成历史，触发 FlowLinesManager 处理
        if (processChain.length > 0) {
          console.log('[Canvas] 触发流程线渲染, asset:', asset.name);
          setAssetInfo({
            x,
            y,
            id: asset.id,
            name: asset.name,
            ext2: assetExt2,
            assetData: asset
          });
        } else {
          // 立即创建节点（不等待 API）
          addNode('imageNode', { x, y }, {
            data: {
              imageUrl: asset.id?.toString() || '',
              assetId: asset.id,
              label: asset.name || asset.resourceName || 'Asset',
              assetData: asset,
            }
          });
          
          // ========== 后台异步获取最新数据，获取后更新节点 ==========
          if (asset.id) {
            (async () => {
              try {
                const { imageApi } = await import('../../api/image');
                const latestAsset = await imageApi.getById(asset.id);
                if (latestAsset?.ext2 && latestAsset.ext2 !== assetExt2) {
                  console.log('[Canvas] 后台获取到最新 ext2:', latestAsset.ext2);
                  // 可以选择更新节点或提示用户
                }
              } catch (err) {
                console.error('[Canvas] 后台获取资产最新数据失败:', err);
              }
            })();
          }
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
  }, [addNode, viewPort.x, viewPort.y, viewPort.zoom, nodes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 处理重复资产的确认 - 移动画布到原有资产位置
  const handleMoveToExisting = useCallback(() => {
    if (!duplicateAsset) return;
    
    const { existingNodeId } = duplicateAsset;
    const { nodes, updateViewPort } = useCanvasStore.getState();
    
    // 找到原有节点的位置
    const existingNode = nodes.find(n => n.id === existingNodeId);
    if (existingNode) {
      // 计算合适的缩放比例，使节点能完整显示
      const canvasWidth = containerRef.current?.clientWidth || 800;
      const canvasHeight = containerRef.current?.clientHeight || 600;
      const nodeWidth = existingNode.width || 200;
      const nodeHeight = existingNode.height || 120;
      
      // 计算缩放比例（留出边距）
      const zoomX = (canvasWidth * 0.8) / nodeWidth;
      const zoomY = (canvasHeight * 0.8) / nodeHeight;
      const zoom = Math.min(Math.min(zoomX, zoomY), 1.5);  // 最大1.5倍
      
      // 计算居中位置
      const x = -existingNode.position.x * zoom + canvasWidth / 2 - (nodeWidth * zoom) / 2;
      const y = -existingNode.position.y * zoom + canvasHeight / 2 - (nodeHeight * zoom) / 2;
      updateViewPort({ x, y, zoom });
      
      // 选中该节点
      useCanvasStore.getState().selectNode(existingNodeId);
    }
    
    console.log('[Canvas] 已移动画布到原有资产位置');
    setDuplicateAsset(null);
  }, [duplicateAsset]);

  // 处理重复资产的确认 - 删除原有节点并重新创建
  const handleCreateNew = useCallback(() => {
    if (!duplicateAsset) return;
    
    const { x, y, id, name, ext2, assetData, existingNodeId } = duplicateAsset;
    const { nodes, deleteNode } = useCanvasStore.getState();
    const processChain = ext2 ? JSON.parse(ext2) : [];
    
    // 收集需要删除的节点ID（包括原有节点和其流程下的所有子节点）
    const nodesToDelete = new Set<string>([existingNodeId]);
    
    if (processChain.length > 0) {
      // 找出流程下的所有子节点（根据 assetId 匹配）
      processChain.forEach((item: { targetId: number }) => {
        const childNode = nodes.find(n => n.data?.assetId === item.targetId);
        if (childNode) {
          nodesToDelete.add(childNode.id);
        }
      });
    }
    
    // 删除所有相关节点
    nodesToDelete.forEach(nodeId => deleteNode(nodeId));
    
    console.log('[Canvas] 已删除节点:', Array.from(nodesToDelete));
    
    // 然后创建新节点
    if (processChain.length > 0) {
      // 触发流程线渲染
      setAssetInfo({ x, y, id, name, ext2, assetData });
    } else {
      // 立即创建节点
      addNode('imageNode', { x, y }, {
        data: {
          imageUrl: id?.toString() || '',
          assetId: id,
          label: name || assetData?.resourceName || 'Asset',
          assetData: assetData,
        }
      });
    }
    
    console.log('[Canvas] 已删除原有节点及其流程并在新位置创建');
    setDuplicateAsset(null);
  }, [duplicateAsset, addNode]);

  // 取消重复资产确认
  const handleCancelDuplicate = useCallback(() => {
    setDuplicateAsset(null);
  }, []);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 空格键按下 - 用于平移画布
      if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
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
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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
      {/* 重复资产确认对话框 */}
      {duplicateAsset && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-800 rounded-lg p-4 shadow-xl border border-gray-700">
            <p className="text-white text-sm mb-3">
              资产 <span className="text-pink-400 font-medium">{duplicateAsset.name}</span> 已在画布中
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleMoveToExisting}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
              >
                移动到资产
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                重新创建
              </button>
              <button
                onClick={handleCancelDuplicate}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <CanvasToolbar viewPort={viewPort} />

      {/* 操作提示 - 左下角，左侧边栏展开时隐藏 */}
      {!leftPanelOpen && (
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="absolute bottom-4 left-4 z-40 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 shadow-lg border border-gray-700 transition-transform hover:scale-110"
          title={showHelp ? "隐藏操作提示" : "显示操作提示"}
        >
          ?
        </button>
      )}
      
      {/* 提示内容 - 展开时显示在 ? 按钮右侧，左侧边栏展开时也隐藏 */}
      {showHelp && !leftPanelOpen && (
        <div className="absolute bottom-4 left-14 z-40 bg-gray-900/95 text-gray-300 text-xs px-3 py-2 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center gap-4">
            <p><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-200">滚轮</kbd> 缩放</p>
            <p><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-200">中键</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-200">Alt</kbd> 平移</p>
            <p><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-200">双击</kbd> 复位</p>
            <p><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-200">Del</kbd> 删除</p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden canvas-grid"
        style={{ 
          cursor: isPanning ? 'grabbing' 
            : isSelecting ? 'crosshair' 
            : connectingSource ? 'crosshair' 
            : isSpacePressed ? 'grab' 
            : 'default' 
        }}
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
          style={{ transform: `translate(${viewPort.x}px, ${viewPort.y}px) scale(${viewPort.zoom})` }}
        >
          {/* 连线渲染器 */}
          <ConnectionRenderer />

          {/* 流程线管理 */}
          <FlowLinesManager assetInfo={assetInfo} onComplete={() => setFlowLineCount(c => c + 1)} />

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
