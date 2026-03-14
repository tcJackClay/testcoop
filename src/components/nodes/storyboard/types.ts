// src/components/nodes/storyboard/types.ts - 故事板类型定义
export interface Frame {
  id: string;
  frameNumber: string;
  time: string;
  scale: string;
  description: string;
}

export interface Shot {
  id: string;
  index: number;
  shotNumber: number;
  cameraWork: string;
  description: string;
  frames: Frame[];
  prompt?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface ShotGroup {
  id: string;
  name: string;
  shots: Shot[];
}

export interface StoryboardNodeData {
  selectedEpisodeId?: string;
  shotGroups?: ShotGroup[];
  storyboardContent?: string;
  existingStoryboard?: StoryboardScript;
  isGenerating?: boolean;
  [key: string]: unknown;
}

export interface StoryboardScript {
  id: number;
  name?: string;
  resourceName?: string;
  resourceContent?: string;
  resourceType?: string;
  resourceStatus?: string;
  projectId?: number;
  userId?: number;
  ext1?: string;
  [key: string]: unknown;
}
