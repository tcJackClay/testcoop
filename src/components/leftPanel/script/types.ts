// src/components/leftPanel/script/types.ts - 脚本面板类型
export interface ScriptScene {
  id: string;
  name: string;
  summary: string;
  shots: string;
}

export interface ScriptData {
  scenes: ScriptScene[];
  overview: string;
}

export interface ScriptPanelData {
  scriptContent?: string;
  parsedScript?: ScriptData;
  selectedSceneId?: string;
  [key: string]: unknown;
}
