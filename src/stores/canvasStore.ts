// Canvas Store - 核心状态管理
import { create } from 'zustand';
import type { CanvasState } from './canvasTypes';
import { createCanvasNodesSlice, type CanvasNodesSlice } from './canvasNodes';
import { createCanvasConnectionsSlice, type CanvasConnectionsSlice } from './canvasConnections';
import { createCanvasHistorySlice, type CanvasHistorySlice } from './canvasHistory';
import { createCanvasViewportSlice, type CanvasViewportSlice } from './canvasViewport';
import { setNodeIdCounter, getNodeIdCounter } from './canvasNodeDefaults';

export type CanvasStore = CanvasState & CanvasNodesSlice & CanvasConnectionsSlice & CanvasHistorySlice & CanvasViewportSlice;

// 获取当前项目 ID
const getCurrentProjectId = (): number | undefined => {
  try {
    const projectStorage = localStorage.getItem('project-storage');
    if (projectStorage) {
      const projectId = JSON.parse(projectStorage).state?.currentProjectId;
      return projectId;
    }
  } catch {}
  return undefined;
};

// 存储键名前缀
const STORAGE_PREFIX = 'canvas_';

// 加载指定项目的画布数据
const loadCanvasState = (projectId: number) => {
  try {
    const key = `${STORAGE_PREFIX}${projectId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return null;
};

// 保存指定项目的画布数据
const saveCanvasState = (projectId: number, state: { nodes: any[]; connections: any[]; viewPort: any }) => {
  try {
    const key = `${STORAGE_PREFIX}${projectId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('保存画布状态失败:', e);
  }
};

// 创建基础 store
const baseStore = create<CanvasStore>()((...args) => ({
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

// 初始化：加载当前项目的画布数据
const initCanvasState = () => {
  const projectId = getCurrentProjectId();
  if (projectId) {
    const saved = loadCanvasState(projectId);
    if (saved) {
      // 更新节点 ID 计数器，避免 ID 冲突
      if (saved.nodes && saved.nodes.length > 0) {
        const maxId = saved.nodes.reduce((max: number, node: any) => {
          const match = node.id?.match(/node_(\d+)/);
          const num = match ? parseInt(match[1], 10) : 0;
          return num > max ? num : max;
        }, 0);
        setNodeIdCounter(maxId);
        console.log('[CanvasStore] 已恢复节点计数器到:', maxId);
      }
      
      baseStore.setState({
        nodes: saved.nodes || [],
        connections: saved.connections || [],
        viewPort: saved.viewPort || { x: 0, y: 0, zoom: 1 },
      });
    }
  }
};

// 立即初始化
initCanvasState();

// 监听项目变化，重新加载数据
let lastProjectId: number | undefined = getCurrentProjectId();
setInterval(() => {
  const currentProjectId = getCurrentProjectId();
  if (currentProjectId !== lastProjectId) {
    lastProjectId = currentProjectId;
    if (currentProjectId) {
      const saved = loadCanvasState(currentProjectId);
      if (saved) {
        // 更新节点 ID 计数器
        if (saved.nodes && saved.nodes.length > 0) {
          const maxId = saved.nodes.reduce((max: number, node: any) => {
            const match = node.id?.match(/node_(\d+)/);
            const num = match ? parseInt(match[1], 10) : 0;
            return num > max ? num : max;
          }, 0);
          setNodeIdCounter(maxId);
        }
        
        baseStore.setState({
          nodes: saved.nodes || [],
          connections: saved.connections || [],
          viewPort: saved.viewPort || { x: 0, y: 0, zoom: 1 },
        });
      } else {
        // 新项目
        baseStore.setState({
          nodes: [],
          connections: [],
          viewPort: { x: 0, y: 0, zoom: 1 },
        });
      }
    }
  }
}, 1000);

// 每次状态变化时自动保存
baseStore.subscribe((state) => {
  const projectId = getCurrentProjectId();
  if (projectId) {
    saveCanvasState(projectId, {
      nodes: state.nodes,
      connections: state.connections,
      viewPort: state.viewPort,
    });
  }
});

// 导出 store
export const useCanvasStore = baseStore;

// Re-export types for convenience
export type { CanvasNode, Connection, ViewPort, NodeType } from './canvasTypes';
