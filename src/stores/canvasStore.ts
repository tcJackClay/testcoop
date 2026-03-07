import { create } from 'zustand';

// Node types
export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface ViewPort {
  x: number;
  y: number;
  zoom: number;
}

interface CanvasState {
  nodes: CanvasNode[];
  connections: Connection[];
  viewPort: ViewPort;
  selectedNodeIds: string[];
  
  // Actions
  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  
  addConnection: (sourceId: string, targetId: string, sourceHandle?: string, targetHandle?: string) => void;
  deleteConnection: (id: string) => void;
  
  updateViewPort: (viewport: Partial<ViewPort>) => void;
}

const nodeDefaults: Record<string, Partial<CanvasNode>> = {
  imageInput: { type: 'imageInput', data: { label: 'Image Input' } },
  videoInput: { type: 'videoInput', data: { label: 'Video Input' } },
  aiImage: { type: 'aiImage', data: { label: 'AI Image', prompt: '' } },
  aiVideo: { type: 'aiVideo', data: { label: 'AI Video', prompt: '' } },
  preview: { type: 'preview', data: { label: 'Preview' } },
  saveLocal: { type: 'saveLocal', data: { label: 'Save to Local' } },
};

let nodeIdCounter = 0;
const generateNodeId = () => `node_${++nodeIdCounter}`;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  connections: [],
  viewPort: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: [],

  addNode: (type, position) => {
    const defaults = nodeDefaults[type] || { type, data: { label: type } };
    const newNode: CanvasNode = {
      id: generateNodeId(),
      ...defaults,
      position,
      data: { ...defaults.data },
    } as CanvasNode;
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter(
        (c) => c.sourceId !== id && c.targetId !== id
      ),
      selectedNodeIds: state.selectedNodeIds.filter((nid) => nid !== id),
    }));
  },

  deleteSelectedNodes: () => {
    const { selectedNodeIds } = get();
    set((state) => ({
      nodes: state.nodes.filter((n) => !selectedNodeIds.includes(n.id)),
      connections: state.connections.filter(
        (c) => !selectedNodeIds.includes(c.sourceId) && !selectedNodeIds.includes(c.targetId)
      ),
      selectedNodeIds: [],
    }));
  },

  moveNode: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
    }));
  },

  selectNode: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const isSelected = state.selectedNodeIds.includes(id);
        return {
          selectedNodeIds: isSelected
            ? state.selectedNodeIds.filter((nid) => nid !== id)
            : [...state.selectedNodeIds, id],
        };
      }
      return { selectedNodeIds: [id] };
    });
  },

  clearSelection: () => {
    set({ selectedNodeIds: [] });
  },

  addConnection: (sourceId, targetId, sourceHandle, targetHandle) => {
    const id = `conn_${sourceId}_${targetId}`;
    set((state) => ({
      connections: [...state.connections, { id, sourceId, targetId, sourceHandle, targetHandle }],
    }));
  },

  deleteConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    }));
  },

  updateViewPort: (viewport) => {
    set((state) => ({
      viewPort: { ...state.viewPort, ...viewport },
    }));
  },
}));
