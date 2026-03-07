import { useCallback, useEffect, RefObject } from 'react';
import { useCanvasStore, type NodeType } from '../../stores/canvasStore';

interface UseCanvasEventsProps {
  containerRef: RefObject<HTMLDivElement | null>;
  viewPort: { x: number; y: number; zoom: number };
  isPanning: boolean;
  isSelecting: boolean;
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  selectionStart: { x: number; y: number };
  panStart: { x: number; y: number };
  setIsPanning: (val: boolean) => void;
  setIsSelecting: (val: boolean) => void;
  setSelectionBox: (box: { x: number; y: number; width: number; height: number } | null) => void;
  setSelectionStart: (pos: { x: number; y: number }) => void;
  setPanStart: (pos: { x: number; y: number }) => void;
  setContextMenu: (menu: { visible: boolean; x: number; y: number; worldX: number; worldY: number }) => void;
  clearSelection: () => void;
  updateViewPort: (vp: { x?: number; y?: number; zoom?: number }) => void;
  selectNodesInBox: (box: { x: number; y: number; width: number; height: number }) => void;
}

export function useCanvasEvents({
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
  setPanStart,
  setContextMenu,
  clearSelection,
  updateViewPort,
  selectNodesInBox,
}: UseCanvasEventsProps) {
  const { addNode, deleteSelectedNodes, undo, redo, undoStack, redoStack, copyNodes, pasteNodes, selectAll, selectedNodeIds } = useCanvasStore();

  // Handle wheel zoom
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewPort.zoom * delta, 0.1), 3);
    updateViewPort({ zoom: newZoom });
  }, [viewPort.zoom, updateViewPort]);

  // Attach wheel event listener
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    element.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => element.removeEventListener('wheel', handleWheelNative);
  }, [handleWheelNative, containerRef]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const worldY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, worldX, worldY });
    }
  }, [viewPort.x, viewPort.y, viewPort.zoom, setContextMenu, containerRef]);

  // Handle double-click
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('canvas-content')) {
      return;
    }
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const worldY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, worldX, worldY });
    }
  }, [viewPort.x, viewPort.y, viewPort.zoom, setContextMenu, containerRef]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);

    // Ctrl+左键框选
    if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearSelection();
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionBox({ x, y, width: 0, height: 0 });
      return;
    }

    // 中键或Alt+左键拖动画布
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewPort.x, y: e.clientY - viewPort.y });
    } else if (e.button === 0 && e.target === containerRef.current) {
      clearSelection();
    }
  }, [viewPort.x, viewPort.y, clearSelection, containerRef, setIsPanning, setSelectionStart, setSelectionBox, setPanStart]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
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
  }, [isPanning, isSelecting, panStart, selectionStart, updateViewPort, containerRef, setSelectionBox]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      selectNodesInBox(selectionBox);
    }
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
  }, [isSelecting, selectionBox, selectNodesInBox, setIsPanning, setIsSelecting, setSelectionBox]);

  // Handle keyboard shortcuts
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyNodes();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteNodes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, deleteSelectedNodes, undo, redo, clearSelection, selectAll, copyNodes, pasteNodes]);

  return {
    handleContextMenu,
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
