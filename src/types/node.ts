// Canvas Node Types

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Node Data Types
export interface ImageInputData {
  label: string;
  imageUrl?: string;
  localFile?: File;
}

export interface VideoInputData {
  label: string;
  videoUrl?: string;
  localFile?: File;
}

export interface AIImageData {
  label: string;
  prompt: string;
  negativePrompt?: string;
  modelId?: number;
  width?: number;
  height?: number;
  ratio?: string;
  seed?: number;
}

export interface AIVideoData {
  label: string;
  prompt: string;
  modelId?: number;
  duration?: number;
  ratio?: string;
  seed?: number;
}

export interface PreviewData {
  label: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface SaveLocalData {
  label: string;
  savePath?: string;
  autoSave?: boolean;
}

// Node Type Union
export type NodeData = 
  | ImageInputData 
  | VideoInputData 
  | AIImageData 
  | AIVideoData 
  | PreviewData 
  | SaveLocalData;

// Node Type Definition
export interface NodeDefinition {
  type: string;
  category: 'input' | 'output' | 'ai' | 'tool';
  defaultData: NodeData;
  inputs: string[];
  outputs: string[];
}
