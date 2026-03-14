// src/stores/storyboard/types.ts - 故事板 Store 类型
export interface StoryboardState {
  episodes: Episode[];
  currentEpisodeId: number | null;
  scriptContent: string;
  shotGroups: ShotGroup[];
  isLoading: boolean;
  error: string | null;
}

export interface Episode {
  id: number;
  name: string;
  order: number;
}

export interface ShotGroup {
  id: string;
  groupNumber: string;
  cameraWork: string;
  description: string;
  frames: Frame[];
  order: number;
}

export interface Frame {
  id: string;
  frameNumber: string;
  scale: string;
  description: string;
  duration: string;
  order: number;
}
