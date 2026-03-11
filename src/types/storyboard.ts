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
  referenceImages?: string[];  // 多图参考 (最多5张)
  modelId?: number;
  status: ShotStatus;
  outputEnabled: boolean;
  locked: boolean;
  // 首尾帧控制
  useFirstLastFrame?: boolean;
  firstFrame?: string;
  lastFrame?: string;
  // 多图参考开关
  useMultiRef?: boolean;
  // 活动输入 (用于首尾帧模式)
  activeInput?: 'first' | 'last' | 'single';
  // 视频相关
  imageFilename?: string;
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

// Storyboard Mode (image/video)
export type StoryboardMode = 'image' | 'video';

// Script Split Modes
export type SplitMode = 'script' | 'novel' | 'custom' | 'table_summary';

// LLM Split Mode Options
export const STORYBOARD_LLM_SPLIT_MODES: SplitMode[] = ['script', 'novel', 'custom', 'table_summary'];

// Shot Types
export const SHOT_TYPES = [
  'Wide Shot',
  'Medium Shot', 
  'Close-Up',
  'Extreme Close-Up',
  'Over the Shoulder',
  'POV',
  'Establishing',
  'Insert'
];

// Camera Movements
export const CAMERA_MOVEMENTS = [
  'Static',
  'Pan',
  'Tilt',
  'Dolly',
  'Truck',
  'Zoom',
  'Tracking',
  'Crane',
  'Handheld',
  'Steadicam'
];
