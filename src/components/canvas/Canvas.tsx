import { useRef, useState, useCallback, useEffect } from 'react';
import { Grid3X3, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { imageApi } from '../../api/image';
import { useCanvasStore, type NodeType } from '../../stores/canvasStore';
import NodeRenderer from '../nodes/NodeRenderer';
import CanvasToolbar from './CanvasToolbar';
import CanvasContextMenu from './CanvasContextMenu';
import { useCanvasConnections } from './useCanvasConnections';
import FlowLinesManager from './FlowLinesManager';
import FlowLines from './FlowLines';

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

interface DuplicateAssetState {
  x: number;
  y: number;
  id: number;
  name: string;
  ext2?: string;
  assetData?: any;
  existingNodeId: string;
}

const helpTips = [
  { key: '滚轮', value: '缩放画布' },
  { key: '中键 / Alt', value: '平移视图' },
  { key: '双击空白区', value: '恢复初始视图' },
  { key: 'Del', value: '删除选中节点' },
];

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
  const [zoomTip, setZoomTip] = useState<string | null>(null);

  const {
    nodes,
    viewPort,
    addNode,
    updateViewPort,
    deleteSelectedNodes,
    selectedNodeIds,
    undo,
    redo,
    selectNodesInBox,
    clearSelection,
    copyNodes,
    pasteNodes,
  } = useCanvasStore();

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

  const [assetInfo, setAssetInfo] = useState<{ x: number; y: number; id: number; name: string; ext2?: string; assetData?: any } | null>(null);
  const [flowLineCount, setFlowLineCount] = useState(0);
  const [duplicateAsset, setDuplicateAsset] = useState<DuplicateAssetState | null>(null);

  useEffect(() => {
    if (assetInfo && flowLineCount > 0) {
      setAssetInfo(null);
      setFlowLineCount(0);
    }
  }, [assetInfo, flowLineCount]);

  const showZoomTip = useCallback((nextZoom: number) => {
    setZoomTip(`${Math.round(nextZoom * 100)}%`);
    window.setTimeout(() => setZoomTip(null), 800);
  }, []);

  const handleWheelNative = useCallback((event: WheelEvent) => {
    event.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldX = (mouseX - viewPort.x) / viewPort.zoom;
    const worldY = (mouseY - viewPort.y) / viewPort.zoom;
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    const newX = mouseX - worldX * newZoom;
    const newY = mouseY - worldY * newZoom;

    updateViewPort({ x: newX, y: newY, zoom: newZoom });
    showZoomTip(newZoom);
  }, [showZoomTip, updateViewPort, viewPort.x, viewPort.y, viewPort.zoom]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => element.removeEventListener('wheel', handleWheelNative);
  }, [handleWheelNative]);

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
    showZoomTip(newZoom);
  }, [showZoomTip, updateViewPort, viewPort.x, viewPort.y, viewPort.zoom]);

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
    showZoomTip(newZoom);
  }, [showZoomTip, updateViewPort, viewPort.x, viewPort.y, viewPort.zoom]);

  const handleFitView = useCallback(() => {
    if (nodes.length === 0) {
      updateViewPort({ x: 0, y: 0, zoom: 1 });
      return;
    }

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const padding = 50;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
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
    showZoomTip(zoom);
  }, [nodes, showZoomTip, updateViewPort]);

  const handleResetView = useCallback(() => {
    updateViewPort({ x: 0, y: 0, zoom: 1 });
    showZoomTip(1);
  }, [showZoomTip, updateViewPort]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldX = (mouseX - viewPort.x) / viewPort.zoom;
    const worldY = (mouseY - viewPort.y) / viewPort.zoom;
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    const newX = mouseX - worldX * newZoom;
    const newY = mouseY - worldY * newZoom;

    updateViewPort({ x: newX, y: newY, zoom: newZoom });
    showZoomTip(newZoom);
  }, [showZoomTip, updateViewPort, viewPort.x, viewPort.y, viewPort.zoom]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const worldX = (event.clientX - rect.left - viewPort.x) / viewPort.zoom;
    const worldY = (event.clientY - rect.top - viewPort.y) / viewPort.zoom;
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, worldX, worldY });
  }, [viewPort.x, viewPort.y, viewPort.zoom]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    if (event.target === containerRef.current || (event.target as HTMLElement).classList.contains('canvas-content')) {
      event.preventDefault();
      handleResetView();
      return;
    }

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const worldX = (event.clientX - rect.left - viewPort.x) / viewPort.zoom;
    const worldY = (event.clientY - rect.top - viewPort.y) / viewPort.zoom;
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, worldX, worldY });
  }, [handleResetView, viewPort.x, viewPort.y, viewPort.zoom]);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleAddNodeFromContextMenu = useCallback((type: NodeType) => {
    addNode(type, { x: contextMenu.worldX, y: contextMenu.worldY });
    closeContextMenu();
  }, [addNode, closeContextMenu, contextMenu.worldX, contextMenu.worldY]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    onCanvasMouseDown(event);

    const rect = containerRef.current?.getBoundingClientRect();
    const x = event.clientX - (rect?.left || 0);
    const y = event.clientY - (rect?.top || 0);

    if (event.button === 0 && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionBox({ x, y, width: 0, height: 0 });
      return;
    }

    if (event.button === 1 || (event.button === 0 && (event.altKey || event.shiftKey)) || (event.button === 0 && isSpacePressed)) {
      event.preventDefault();
      setIsPanning(true);
      setPanStart({ x: event.clientX - viewPort.x, y: event.clientY - viewPort.y });
    } else if (event.button === 0 && event.target === containerRef.current) {
      clearSelection();
    }
  }, [clearSelection, isSpacePressed, onCanvasMouseDown, viewPort.x, viewPort.y]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    onCanvasMouseMove(event);

    const rect = containerRef.current?.getBoundingClientRect();
    const x = event.clientX - (rect?.left || 0);
    const y = event.clientY - (rect?.top || 0);

    if (isPanning) {
      updateViewPort({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
    } else if (isSelecting) {
      const selX = Math.min(x, selectionStart.x);
      const selY = Math.min(y, selectionStart.y);
      const width = Math.abs(x - selectionStart.x);
      const height = Math.abs(y - selectionStart.y);
      setSelectionBox({ x: selX, y: selY, width, height });
    }
  }, [isPanning, isSelecting, onCanvasMouseMove, panStart.x, panStart.y, selectionStart.x, selectionStart.y, updateViewPort]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      selectNodesInBox(selectionBox);
    }
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
  }, [isSelecting, selectNodesInBox, selectionBox]);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();

    const assetData = event.dataTransfer.getData('application/json');
    if (assetData && containerRef.current) {
      try {
        const asset = JSON.parse(assetData);
        const rect = containerRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left - viewPort.x) / viewPort.zoom;
        const y = (event.clientY - rect.top - viewPort.y) / viewPort.zoom;

        if (asset.isHistoryFile && asset.imageUrl) {
          addNode('imageNode', { x, y }, {
            data: {
              imageUrl: asset.imageUrl,
              label: asset.name || 'OSS Image',
            },
          });
          return;
        }

        const assetExt2 = asset.ext2 || null;
        const processChain = assetExt2 ? JSON.parse(assetExt2) : [];
        const existingNode = nodes.find((node) => node.data?.assetId === asset.id);

        if (existingNode) {
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

        if (processChain.length > 0) {
          setAssetInfo({
            x,
            y,
            id: asset.id,
            name: asset.name,
            ext2: assetExt2,
            assetData: asset,
          });
        } else {
          addNode('imageNode', { x, y }, {
            data: {
              imageUrl: asset.id?.toString() || '',
              assetId: asset.id,
              label: asset.name || asset.resourceName || 'Asset',
              assetData: asset,
            },
          });

          if (asset.id) {
            try {
              const latestAsset = await imageApi.getById(asset.id);
              if (latestAsset?.ext2 && latestAsset.ext2 !== assetExt2) {
                console.log('[Canvas] latest asset ext2 updated');
              }
            } catch (error) {
              console.error('[Canvas] failed to fetch latest asset', error);
            }
          }
        }
        return;
      } catch (error) {
        console.error('failed to parse asset data:', error);
      }
    }

    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (nodeType && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const y = (event.clientY - rect.top - viewPort.y) / viewPort.zoom;
      addNode(nodeType as NodeType, { x, y });
    }
  }, [addNode, nodes, viewPort.x, viewPort.y, viewPort.zoom]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleMoveToExisting = useCallback(() => {
    if (!duplicateAsset) return;

    const { existingNodeId } = duplicateAsset;
    const { nodes: canvasNodes, updateViewPort: syncViewPort } = useCanvasStore.getState();
    const existingNode = canvasNodes.find((node) => node.id === existingNodeId);

    if (existingNode) {
      const canvasWidth = containerRef.current?.clientWidth || 800;
      const canvasHeight = containerRef.current?.clientHeight || 600;
      const nodeWidth = existingNode.width || 200;
      const nodeHeight = existingNode.height || 120;
      const zoomX = (canvasWidth * 0.8) / nodeWidth;
      const zoomY = (canvasHeight * 0.8) / nodeHeight;
      const zoom = Math.min(Math.min(zoomX, zoomY), 1.5);
      const x = -existingNode.position.x * zoom + canvasWidth / 2 - (nodeWidth * zoom) / 2;
      const y = -existingNode.position.y * zoom + canvasHeight / 2 - (nodeHeight * zoom) / 2;

      syncViewPort({ x, y, zoom });
      useCanvasStore.getState().selectNode(existingNodeId);
      showZoomTip(zoom);
    }

    setDuplicateAsset(null);
  }, [duplicateAsset, showZoomTip]);

  const handleCreateNew = useCallback(() => {
    if (!duplicateAsset) return;

    const { x, y, id, name, ext2, assetData, existingNodeId } = duplicateAsset;
    const { nodes: canvasNodes, deleteNode } = useCanvasStore.getState();
    const processChain = ext2 ? JSON.parse(ext2) : [];
    const nodesToDelete = new Set<string>([existingNodeId]);

    if (processChain.length > 0) {
      processChain.forEach((item: { targetId: number }) => {
        const childNode = canvasNodes.find((node) => node.data?.assetId === item.targetId);
        if (childNode) {
          nodesToDelete.add(childNode.id);
        }
      });
    }

    nodesToDelete.forEach((nodeId) => deleteNode(nodeId));

    if (processChain.length > 0) {
      setAssetInfo({ x, y, id, name, ext2, assetData });
    } else {
      addNode('imageNode', { x, y }, {
        data: {
          imageUrl: id?.toString() || '',
          assetId: id,
          label: name || assetData?.resourceName || 'Asset',
          assetData,
        },
      });
    }

    setDuplicateAsset(null);
  }, [addNode, duplicateAsset]);

  const handleCancelDuplicate = useCallback(() => {
    setDuplicateAsset(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        setIsSpacePressed(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        copyNodes();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        pasteNodes();
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeIds.length > 0 && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        deleteSelectedNodes();
      }
      if (event.key === 'Escape') {
        clearSelection();
        onCanvasClick();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [clearSelection, copyNodes, deleteSelectedNodes, onCanvasClick, pasteNodes, redo, selectedNodeIds.length, undo]);

  useEffect(() => {
    if (!contextMenu.visible) return;

    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [closeContextMenu, contextMenu.visible]);

  return (
    <div className="flex h-full flex-col">
      {duplicateAsset && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-2)] p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Asset Conflict</p>
            <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">当前资产已在画布中</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-primary-300">{duplicateAsset.name}</span> 已存在于当前工作流。你可以直接定位到旧节点，或者删除旧节点后在当前位置重建。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={handleMoveToExisting} className="btn btn-primary">
                定位到已有节点
              </button>
              <button onClick={handleCreateNew} className="btn btn-secondary">
                删除后重建
              </button>
              <button onClick={handleCancelDuplicate} className="btn btn-ghost">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <CanvasToolbar viewPort={viewPort} />

      {!leftPanelOpen && (
        <button
          onClick={() => setShowHelp((value) => !value)}
          className="absolute bottom-5 left-5 z-40 flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[color:rgba(24,32,43,0.92)] text-sm font-semibold text-[var(--text-secondary)] shadow-soft transition hover:border-primary-500/30 hover:text-[var(--text-primary)]"
          title={showHelp ? '隐藏操作提示' : '显示操作提示'}
        >
          ?
        </button>
      )}

      {showHelp && !leftPanelOpen && (
        <div className="absolute bottom-5 left-17 z-40 rounded-3xl border border-[var(--border-soft)] bg-[color:rgba(17,22,29,0.96)] px-4 py-3 shadow-soft backdrop-blur-xl">
          <div className="grid gap-2 text-xs text-[var(--text-secondary)] md:grid-cols-2 xl:grid-cols-4">
            {helpTips.map((tip) => (
              <div key={tip.key} className="flex items-center gap-2">
                <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[var(--text-primary)]">{tip.key}</kbd>
                <span>{tip.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="canvas-grid relative flex-1 overflow-hidden"
        style={{
          cursor: isPanning
            ? 'grabbing'
            : isSelecting
              ? 'crosshair'
              : connectingSource
                ? 'crosshair'
                : isSpacePressed
                  ? 'grab'
                  : 'default',
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
          className="canvas-content absolute inset-0 origin-top-left"
          style={{ transform: `translate(${viewPort.x}px, ${viewPort.y}px) scale(${viewPort.zoom})` }}
        >
          <ConnectionRenderer />
          <FlowLines />
          <FlowLinesManager assetInfo={assetInfo} onComplete={() => setFlowLineCount((count) => count + 1)} />

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
            className="pointer-events-none absolute border-2 border-primary-500 bg-primary-500/10"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}

        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
            <div className="max-w-xl rounded-[32px] border border-[var(--border-soft)] bg-[color:rgba(17,22,29,0.9)] px-8 py-8 text-center shadow-soft backdrop-blur-xl">
              <Grid3X3 className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
              <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">{t('canvas.addNode')}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                从左侧资产库或脚本面板拖入内容，或者在空白处右键添加节点，开始组织你的生成链路。
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span className="rounded-full border border-[var(--border-soft)] px-3 py-1">右键添加节点</span>
                <span className="rounded-full border border-[var(--border-soft)] px-3 py-1">拖拽建立流程</span>
                <span className="rounded-full border border-[var(--border-soft)] px-3 py-1">双击复位视图</span>
              </div>
            </div>
          </div>
        )}

        {zoomTip && (
          <div className="pointer-events-none absolute top-5 right-5 rounded-2xl border border-primary-500/20 bg-[color:rgba(17,22,29,0.94)] px-3 py-2 text-sm font-medium text-primary-300 shadow-soft">
            {zoomTip}
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

        <div className="absolute bottom-5 right-5 flex items-center gap-1 rounded-2xl border border-[var(--border-soft)] bg-[color:rgba(17,22,29,0.92)] p-1 shadow-soft">
          <button
            onClick={handleZoomOut}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-[var(--text-primary)]"
            title="缩小"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[56px] px-2 py-1 text-center text-sm font-medium text-[var(--text-primary)]">
            {Math.round(viewPort.zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-[var(--text-primary)]"
            title="放大"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleFitView}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-[var(--text-primary)]"
            title="适应视图"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
