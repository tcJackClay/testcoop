// src/features/storyboard/types.ts - 故事板类型定义
export interface Shot {
  id: string;
  index: number;
  shotNumber: number;
  description: string;
  prompt?: string;
  negativePrompt?: string;
  cameraMovement?: string;
  shotType?: string;
  duration?: number;
  useFirstLastFrame?: boolean;
  firstFrame?: string;
  lastFrame?: string;
  activeInput?: 'single' | 'firstLast' | 'multi';
  useMultiRef?: boolean;
  referenceImages?: string[];
}

export interface Scene {
  id: string;
  name: string;
  shots: Shot[];
  summary?: string;
}

export interface StoryboardData {
  scenes: Scene[];
  overview: string;
}
