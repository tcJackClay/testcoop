// Canvas History - 历史记录操作
import type { StateCreator } from 'zustand';
import type { CanvasState, ViewPort } from './canvasTypes';

export interface CanvasHistorySlice {
  undo: () => void;
  redo: () => void;
  saveToUndoStack: () => void;
}

export const createCanvasHistorySlice: StateCreator<CanvasState, [], [], CanvasHistorySlice> = (set, get) => ({
  saveToUndoStack: () => {
    const { nodes, connections, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-19), { nodes: [...nodes], connections: [...connections] }],
      redoStack: [],
    });
  },

  undo: () => {
    const { undoStack, nodes, connections } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, { nodes: [...nodes], connections: [...connections] }],
      nodes: previous.nodes,
      connections: previous.connections,
    });
  },

  redo: () => {
    const { redoStack, nodes, connections } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, { nodes: [...nodes], connections: [...connections] }],
      nodes: next.nodes,
      connections: next.connections,
    });
  },
});
