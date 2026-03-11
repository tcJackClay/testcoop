// Script Analysis Types
// 参考 huanu-workbench-frontend 实现

export interface ScriptAnalysisResult {
  id: string;
  projectId: string;
  assets?: {
    characters: AssetItem[];
    scenes: AssetItem[];
    props: AssetItem[];
    secondaryCharacters?: AssetItem[];
    secondaryScenes?: AssetItem[];
    secondaryProps?: AssetItem[];
  };
  storyOutline?: {
    title?: string;
    genre?: string;
    summary?: string;
    chapters?: any[];
  };
  characterBios?: CharacterBio[];
  relationships?: Relationship[];
  suggestedShotGroups?: any[];
  overallStyle?: {
    primaryStyle?: string;
    colorPalette?: Record<string, string>;
    lighting?: Record<string, string>;
  };
}

export interface AssetItem {
  id?: string | number;
  name: string;
  description?: string;
  background?: string;
  variants?: string[];
}

export interface CharacterBio {
  name: string;
  age?: string;
  background?: string;
  personality?: string;
  appearance?: string;
  role?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  description?: string;
}
