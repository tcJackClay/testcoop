// Canvas Connections - 连线相关操作
import type { StateCreator } from 'zustand';
import type { CanvasState, Connection } from './canvasTypes';

export interface CanvasConnectionsSlice {
  addConnection: (sourceId: string, targetId: string, inputType?: string) => void;
  deleteConnection: (id: string) => void;
  getInputNodes: (targetId: string) => Connection[];
  getOutputNodes: (sourceId: string) => Connection[];
  isConnected: (sourceId: string, targetId: string) => boolean;
}

export const createCanvasConnectionsSlice: StateCreator<CanvasState, [], [], CanvasConnectionsSlice> = (set, get) => ({
  // Add new connection
  addConnection: (sourceId, targetId, inputType = 'default') => {
    // Check if connection already exists
    const exists = get().connections.some(
      (c) => c.sourceId === sourceId && c.targetId === targetId
    );
    if (exists) return;
    
    const id = `conn_${sourceId}_${targetId}_${Date.now()}`;
    get().saveToUndoStack();
    set((state) => ({
      connections: [...state.connections, { id, sourceId, targetId, inputType }],
    }));
  },

  // Delete connection
  deleteConnection: (id) => {
    get().saveToUndoStack();
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    }));
  },

  // Get all input connections (nodes that connect TO this node)
  getInputNodes: (targetId) => {
    return get().connections.filter((c) => c.targetId === targetId);
  },

  // Get all output connections (nodes that this node connects TO)
  getOutputNodes: (sourceId) => {
    return get().connections.filter((c) => c.sourceId === sourceId);
  },

  // Check if two nodes are connected
  isConnected: (sourceId, targetId) => {
    return get().connections.some(
      (c) => c.sourceId === sourceId && c.targetId === targetId
    );
  },
});
