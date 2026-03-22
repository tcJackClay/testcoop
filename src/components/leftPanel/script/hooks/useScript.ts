import { useCallback, useState } from 'react';
import { vectorApi } from '../../../../api';
import type { ScriptData, ScriptScene } from '../types';

const isSceneHeader = (line: string): boolean => {
  return /^#/.test(line) || /^scene\b/i.test(line) || /^\d+[.)]/.test(line);
};

export const parseScriptText = (text: string): ScriptData => {
  const scenes: ScriptScene[] = [];
  const lines = text.split('\n');

  let currentScene: ScriptScene | null = null;
  let currentField: 'summary' | 'shots' | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (isSceneHeader(trimmed)) {
      if (currentScene) {
        scenes.push(currentScene);
      }

      currentScene = {
        id: `scene_${scenes.length + 1}`,
        name: trimmed.replace(/^#+\s*/, ''),
        summary: '',
        shots: '',
      };
      currentField = 'summary';
      continue;
    }

    if (/summary|overview/i.test(trimmed)) {
      currentField = 'summary';
      continue;
    }

    if (/shot|shots|storyboard/i.test(trimmed)) {
      currentField = 'shots';
      continue;
    }

    if (!currentScene) {
      currentScene = {
        id: 'scene_1',
        name: 'Scene 1',
        summary: '',
        shots: '',
      };
      currentField = 'summary';
    }

    if (currentField === 'shots') {
      currentScene.shots += `${trimmed}\n`;
    } else {
      currentScene.summary += `${trimmed}\n`;
    }
  }

  if (currentScene) {
    scenes.push(currentScene);
  }

  return {
    scenes,
    overview: '',
  };
};

export const useScriptAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeScript = useCallback(async (scriptContent: string, _projectId: number, _userId: number) => {
    setIsAnalyzing(true);
    try {
      return await vectorApi.chatCompletion({
        prompt: scriptContent,
        type: 2,
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyzeScript, isAnalyzing };
};

export { useCallback, useState };
