import { create } from 'zustand';

// Node types
export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
  collapsed?: boolean;
}

export type NodeType = 
  | 'imageInput' 
  | 'videoInput' 
  | 'textNode' 
  | 'novelInput'
  | 'characterDescription'
  | 'sceneDescription'
  | 'generateCharacterImage'
  | 'generateSceneImage'
  | 'generateCharacterVideo'
  | 'generateSceneVideo'
  | 'createCharacter'
  | 'createScene'
  | 'videoAnalyze'
  | 'storyboardNode'
  | 'aiImage'
  | 'aiVideo'
  | 'imageCompare'
  | 'preview'
  | 'saveLocal';

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

export interface CanvasState {
  nodes: CanvasNode[];
  connections: Connection[];
  viewPort: ViewPort;
  selectedNodeIds: string[];
  
  // Undo/Redo
  undoStack: { nodes: CanvasNode[]; connections: Connection[] }[];
  redoStack: { nodes: CanvasNode[]; connections: Connection[] }[];
  
  // Actions
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectNodesInBox: (box: { x: number; y: number; width: number; height: number }) => void;
  
  addConnection: (sourceId: string, targetId: string, sourceHandle?: string, targetHandle?: string) => void;
  deleteConnection: (id: string) => void;
  
  updateViewPort: (viewport: Partial<ViewPort>) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  saveToUndoStack: () => void;
}

const nodeDefaults: Record<NodeType, Partial<CanvasNode>> = {
  imageInput: { type: 'imageInput', data: { label: 'Image Input', imageUrl: '' } },
  videoInput: { type: 'videoInput', data: { label: 'Video Input', videoUrl: '' } },
  textNode: { type: 'textNode', data: { label: 'Text', content: '' } },
  novelInput: { type: 'novelInput', data: { label: 'Novel Input', content: '' } },
  characterDescription: { type: 'characterDescription', data: { label: 'Character Description' } },
  sceneDescription: { type: 'sceneDescription', data: { label: 'Scene Description' } },
  generateCharacterImage: { type: 'generateCharacterImage', data: { label: 'Generate Character Image', prompt: '' } },
  generateSceneImage: { type: 'generateSceneImage', data: { label: 'Generate Scene Image', prompt: '' } },
  generateCharacterVideo: { type: 'generateCharacterVideo', data: { label: 'Generate Character Video', prompt: '' } },
  generateSceneVideo: { type: 'generateSceneVideo', data: { label: 'Generate Scene Video', prompt: '' } },
  createCharacter: { type: 'createCharacter', data: { label: 'Create Character' } },
  createScene: { type: 'createScene', data: { label: 'Create Scene' } },
  videoAnalyze: { type: 'videoAnalyze', data: { label: 'Video Analyze' } },
  storyboardNode: { type: 'storyboardNode', data: { label: 'Storyboard' } },
  aiImage: { type: 'aiImage', data: { label: 'AI Image', prompt: '', modelId: '' } },
  aiVideo: { type: 'aiVideo', data: { label: 'AI Video', prompt: '', modelId: '' } },
  imageCompare: { type: 'imageCompare', data: { label: 'Image Compare', imageA: '', imageB: '' } },
  preview: { type: 'preview', data: { label: 'Preview' } },
  saveLocal: { type: 'saveLocal', data: { label: 'Save to Local', autoSave: false } },
};

let nodeIdCounter = 0;
const generateNodeId = () => `node_${++nodeIdCounter}`;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  connections: [],
  viewPort: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: [],
  undoStack: [],
  redoStack: [],

  addNode: (type, position) => {
    const defaults = nodeDefaults[type] || { type, data: { label: type } };
    const newNode: CanvasNode = {
      id: generateNodeId(),
      ...defaults,
      position,
      data: { ...defaults.data },
    } as CanvasNode;
    get().saveToUndoStack();
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
  },

  deleteNode: (id) => {
    get().saveToUndoStack();
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
    if (selectedNodeIds.length === 0) return;
    get().saveToUndoStack();
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

  selectNodesInBox: (box) => {
    const { nodes, viewPort } = get();
    const selectedIds = nodes
      .filter((node) => {
        const nodeX = node.position.x * viewPort.zoom + viewPort.x;
        const nodeY = node.position.y * viewPort.zoom + viewPort.y;
        const nodeWidth = (node.width || 200) * viewPort.zoom;
        const nodeHeight = (node.height || 100) * viewPort.zoom;
        
        return (
          nodeX < box.x + box.width &&
          nodeX + nodeWidth > box.x &&
          nodeY < box.y + box.height &&
          nodeY + nodeHeight > box.y
        );
      })
      .map((node) => node.id);
    
    set({ selectedNodeIds: selectedIds });
  },

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

  updateViewPort: (viewport) => {
    set((state) => ({
      viewPort: { ...state.viewPort, ...viewport },
    }));
  },

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
}));
