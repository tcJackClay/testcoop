// Canvas Connections - 连线相关操作
import type { StateCreator } from 'zustand';
import type { CanvasState } from './canvasTypes';

export interface CanvasConnectionsSlice {
  addConnection: (sourceId: string, targetId: string, sourceHandle?: string, targetHandle?: string) => void;
  deleteConnection: (id: string) => void;
}

export const createCanvasConnectionsSlice: StateCreator<CanvasState, [], [], CanvasConnectionsSlice> = (set, get) => ({
  addConnection: (sourceId, targetId, sourceHandle, targetHandle) => {
    const id = `conn_${sourceId}_${targetId}_${Date.now()}`;
    get().saveToUndoStack();
    set((state) => ({
      connections: [...state.connections, { id, sourceId, targetId, sourceHandle, targetHandle }],
    }));
  },

  deleteConnection: (id) => {
    get().saveToUndoStack();
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    }));
  },
});
