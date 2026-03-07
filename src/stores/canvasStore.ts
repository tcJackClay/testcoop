import { taskApi } from '../api/task';
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
};
export type NodeType = 
  | 'videoInput' 
  | 'textNode' 
  | 'novelInput'
  | 'characterDescription'
  | 'sceneDescription'
  | 'generateCharacterVideo'
  | 'generateSceneVideo'
  | 'createCharacter'
  | 'createScene'
  | 'videoAnalyze'
  | 'storyboardNode'
  | 'imageCompare'
  | 'preview'
  | 'imageNode'
  | 'videoNode';

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
  clipboardNodes: CanvasNode[];
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
  selectAll: () => void;
  copyNodes: () => void;
  pasteNodes: (offset?: { x: number; y: number }) => void;
  addConnection: (sourceId: string, targetId: string, sourceHandle?: string, targetHandle?: string) => void;
  deleteConnection: (id: string) => void;
  getNodeExecutionInput: (nodeId: string) => Record<string, unknown>;
  executeNode: (nodeId: string) => Promise<void>;
  updateViewPort: (viewport: Partial<ViewPort>) => void;
  undo: () => void;
  redo: () => void;
  saveToUndoStack: () => void;
}

const nodeDefaults: Record<NodeType, Partial<CanvasNode>> = {
  videoInput: { type: 'videoInput', data: { label: 'Video Input', videoUrl: '' } },
  textNode: { type: 'textNode', data: { label: 'Text', content: '' } },
  novelInput: { type: 'novelInput', data: { label: 'Novel Input', content: '' } },
  characterDescription: { type: 'characterDescription', data: { label: 'Character Description' } },
  sceneDescription: { type: 'sceneDescription', data: { label: 'Scene Description' } },
  generateCharacterVideo: { type: 'generateCharacterVideo', data: { label: 'Generate Character Video', prompt: '' } },
  generateSceneVideo: { type: 'generateSceneVideo', data: { label: 'Generate Scene Video', prompt: '' } },
  createCharacter: { type: 'createCharacter', data: { label: 'Create Character' } },
  createScene: { type: 'createScene', data: { label: 'Create Scene' } },
  videoAnalyze: { type: 'videoAnalyze', data: { label: 'Video Analyze' } },
  storyboardNode: { type: 'storyboardNode', data: { label: 'Storyboard' } },
  aiVideo: { type: 'aiVideo', data: { label: 'AI Video', prompt: '', modelId: '' } },
  imageCompare: { type: 'imageCompare', data: { label: 'Image Compare', imageA: '', imageB: '' } },
  preview: { type: 'preview', data: { label: 'Preview' } },
  imageNode: { 
    type: 'imageNode', 
    data: { 
      label: 'Image', 
      imageUrl: '',
      prompt: '',
      aspectRatio: '1:1',
      resolution: '1K',
      status: 'idle'
    } 
  },
  videoNode: { 
    type: 'videoNode', 
    data: { 
      label: 'Video', 
      videoUrl: '',
      prompt: '',
      status: 'idle'
    } 
  },
};

let nodeIdCounter = 0;
const generateNodeId = () => `node_${++nodeIdCounter}`;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  connections: [],
  viewPort: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: [],
  clipboardNodes: [],
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

  selectAll: () => {
    const { nodes } = get();
    set({ selectedNodeIds: nodes.map((node) => node.id) });
  },

  copyNodes: () => {
    const { nodes, selectedNodeIds } = get();
    const nodesToCopy = nodes.filter(n => selectedNodeIds.includes(n.id));
    set({ clipboardNodes: JSON.parse(JSON.stringify(nodesToCopy)) });
  },

  pasteNodes: (offset = { x: 50, y: 50 }) => {
    const { clipboardNodes, nodes, addNode } = get();
    if (clipboardNodes.length === 0) return;
    
    get().saveToUndoStack();
    
    const maxX = Math.max(...nodes.map(n => n.position.x), 0);
    const maxY = Math.max(...nodes.map(n => n.position.y), 0);
    const pasteX = maxX + offset.x;
    const pasteY = maxY + offset.y;
    
    const newNodes = clipboardNodes.map(node => ({
      ...node,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: { x: node.position.x + pasteX, y: node.position.y + pasteY },
    }));
    
    newNodes.forEach(node => {
      addNode(node.type, node.position);
    });
    
    set({ selectedNodeIds: newNodes.map(n => n.id) });
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

  // 获取节点的输入数据（从上游连接节点传递）
  getNodeInputData: (nodeId) => {
    const { nodes, connections } = get();
    
    // 1. 查找连接到当前节点的源节点
    const incomingConn = connections.find(c => c.targetId === nodeId);
    if (!incomingConn) {
      return null;
    }
    
    // 2. 获取源节点
    const sourceNode = nodes.find(n => n.id === incomingConn.sourceId);
    if (!sourceNode) {
      return null;
    }
    
    // 3. 返回源节点的数据
    return sourceNode.data;
  },

  // 获取节点的执行输入（优先使用上游数据，否则使用节点自身的 prompt 或 content）
  getNodeExecutionInput: (nodeId) => {
    const { nodes } = get();
    
    // 1. 尝试获取上游数据
    const upstreamData = get().getNodeInputData(nodeId);
    if (upstreamData) {
      return upstreamData;
    }
    
    // 2. 获取节点自身数据作为 fallback
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // 优先使用 prompt 字段，其次使用 content 字段
      const prompt = node.data.prompt as string | undefined;
      const content = node.data.content as string | undefined;
      if (prompt) return { prompt };
      if (content) return { content };
    }
    
    // 3. 都没有返回空对象
    return {};
  },

  // 执行节点：调用任务 API 生成图片或视频
  executeNode: async (nodeId) => {
    const { nodes, updateNode, addNode, addConnection } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // 获取输入数据
    const inputData = get().getNodeExecutionInput(nodeId);
    const prompt = (inputData.prompt as string) || (inputData.content as string) || '';

    // 跳过没有 prompt 的执行
    if (!prompt) {
      console.warn('No prompt available for node:', nodeId);
      return;
    }

    // 确定任务类型 (imageNode = 图片, videoNode = 视频)
    const isVideoNode = node.type === 'videoNode' || ['aiVideo', 'generateCharacterVideo', 'generateSceneVideo'].includes(node.type);
    const isImageNode = node.type === 'imageNode';
    const taskType = isVideoNode ? 'video' : 'image';

    // 默认 modelId (需要根据实际情况调整)
    const modelId = 1;

    try {
      // 更新状态为执行中
      updateNode(nodeId, { data: { ...node.data, status: 'processing' } });

      // 调用 API
      const response = await taskApi.create({
        modelId,
        prompt,
        params: { nodeType: node.type, taskType }
      });

      if (response.data?.data) {
        const taskResult = response.data.data;
        
        // 更新状态和 taskId
        updateNode(nodeId, { 
          data: { 
            ...node.data, 
            status: taskResult.status,
            taskId: taskResult.id
          } 
        });
        
        // 如果是图片生成任务，自动创建 imageNode 并连接
        if (!isVideoNode && taskResult.result) {
          const imageNodeId = `imageNode_${Date.now()}`;
          const newImageNode = {
            id: imageNodeId,
            type: 'imageNode' as NodeType,
            position: { x: node.position.x + 350, y: node.position.y },
            data: { 
              label: 'Generated Image', 
              imageUrl: taskResult.result,
              status: 'completed'
            }
          };
          
          // 保存到 undo stack 并添加节点
          get().saveToUndoStack();
          set((state) => ({ nodes: [...state.nodes, newImageNode] }));
          
          // 创建连接边
          addConnection(nodeId, imageNodeId);
        }
      }
    } catch (error) {
      // 更新状态为失败
      updateNode(nodeId, { 
        data: { 
          ...node.data, 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        } 
      });
    }
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
