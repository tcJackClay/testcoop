// Canvas Types - 类型定义
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
  | 'videoNode'
  | 'createAsset'
  | 'aiVideo'
  | 'aiImage'
  | 'generateCharacterImage'
  | 'generateSceneImage'
  | 'imageInput'
  | 'saveLocal'
  | 'promptNode';

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
}
