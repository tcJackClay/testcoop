// Canvas Store - 核心状态管理
import { create } from 'zustand';
import type { CanvasState } from './canvasTypes';
import { createCanvasNodesSlice, type CanvasNodesSlice } from './canvasNodes';
import { createCanvasConnectionsSlice, type CanvasConnectionsSlice } from './canvasConnections';
import { createCanvasHistorySlice, type CanvasHistorySlice } from './canvasHistory';
import { createCanvasViewportSlice, type CanvasViewportSlice } from './canvasViewport';

export type CanvasStore = CanvasState & CanvasNodesSlice & CanvasConnectionsSlice & CanvasHistorySlice & CanvasViewportSlice;

export const useCanvasStore = create<CanvasStore>()((...args) => ({
  // Core State
  nodes: [],
  connections: [],
  viewPort: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: [],
  clipboardNodes: [],
  undoStack: [],
  redoStack: [],
  // Node Operations
  ...createCanvasNodesSlice(...args),
  // Connection Operations  
  ...createCanvasConnectionsSlice(...args),
  // History Operations
  ...createCanvasHistorySlice(...args),
  // Viewport Operations
  ...createCanvasViewportSlice(...args),
}));

// Re-export types for convenience
export type { CanvasNode, Connection, ViewPort, NodeType } from './canvasTypes';
