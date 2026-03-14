// src/components/canvas/useCanvasViewport.ts - 视口管理 Hook
import { useState, useCallback } from 'react';

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export const useCanvasViewport = (initialViewport?: ViewportState) => {
  const [viewport, setViewport] = useState<ViewportState>(
    initialViewport || { x: 0, y: 0, zoom: 1 }
  );

  const pan = useCallback((dx: number, dy: number) => {
    setViewport(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }, []);

  const zoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setViewport(v => {
      const newZoom = Math.max(0.1, Math.min(3, v.zoom + delta));
      return { ...v, zoom: newZoom };
    });
  }, []);

  const reset = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, []);

  const setView = useCallback((x: number, y: number, zoom?: number) => {
    setViewport(v => ({ 
      ...v, 
      x, 
      y, 
      zoom: zoom ?? v.zoom 
    }));
  }, []);

  return {
    viewport,
    setViewport,
    pan,
    zoom,
    reset,
    setView,
  };
};
