// Storyboard Types

export interface Storyboard {
  id: number;
  name: string;
  projectId?: number;
  userId: number;
  shots: Shot[];
  createTime: string;
  updateTime?: string;
}

export interface Shot {
  id: string;
  index: number;
  sceneNumber: number;
  shotNumber: number;
  description: string;
  duration?: number;
  cameraMovement?: string;
  shotType?: string;
  prompt?: string;
  negativePrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  referenceImages?: string[];
  modelId?: number;
  status: ShotStatus;
  outputEnabled: boolean;
  locked: boolean;
}

export type ShotStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ShotBatchGenerateRequest {
  storyboardId: number;
  shotIds: string[];
  modelId?: number;
  concurrent?: number;
  interval?: number;
}

export interface ShotBatchGenerateResult {
  success: number;
  failed: number;
  results: Array<{
    shotId: string;
    status: ShotStatus;
    error?: string;
  }>;
}

// Storyboard View Mode
export type StoryboardViewMode = 'card' | 'table';

// Script Split Modes
export type SplitMode = 'script' | 'novel' | 'custom';
