// Canvas Types - 类型定义
export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: any;
  width?: number;
  height?: number;
  collapsed?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export type NodeType = 
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
  | 'imageNode'
  | 'videoNode'
  | 'createAsset'
  | 'aiVideo'
  | 'aiImage'
  | 'generateCharacterImage'
  | 'generateSceneImage'
  | 'saveLocal'
  | 'promptNode'
  | 'historyNode'
  | 'runninghub';

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
  targetHandle?: string;
  inputType?: string; // 输入类型: 'default', 'image', 'text' 等
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
  currentProjectId?: number;
  selectedNodeIds: string[];
  clipboardNodes: CanvasNode[];
  undoStack: { nodes: CanvasNode[]; connections: Connection[] }[];
  redoStack: { nodes: CanvasNode[]; connections: Connection[] }[];
  addNode: (type: NodeType, position: Position, initialData?: Partial<CanvasNode>) => string;
  updateNode: (id: string, data: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  moveNode: (id: string, position: Position) => void;
  moveSelectedNodes: (deltaX: number, deltaY: number) => void;
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectNodesInBox: (box: { x: number; y: number; width: number; height: number }) => void;
  selectAll: () => void;
  copyNodes: () => void;
  pasteNodes: (offset?: Position) => void;
  addConnection: (sourceId: string, targetId: string, inputType?: string) => void;
  deleteConnection: (id: string) => void;
  getInputNodes: (targetId: string) => Connection[];
  getOutputNodes: (sourceId: string) => Connection[];
  isConnected: (sourceId: string, targetId: string) => boolean;
  undo: () => void;
  redo: () => void;
  saveToUndoStack: () => void;
  updateViewPort: (viewport: Partial<ViewPort>) => void;
  executeNode?: (id: string) => void;
}
