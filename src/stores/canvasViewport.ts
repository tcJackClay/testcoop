// Canvas Viewport - 视口相关操作
import type { StateCreator } from 'zustand';
import type { CanvasState, ViewPort } from './canvasTypes';

export interface CanvasViewportSlice {
  updateViewPort: (viewport: Partial<ViewPort>) => void;
}

export const createCanvasViewportSlice: StateCreator<CanvasState, [], [], CanvasViewportSlice> = (set) => ({
  updateViewPort: (viewport) => {
    set((state) => ({
      viewPort: { ...state.viewPort, ...viewport },
    }));
  },
});
