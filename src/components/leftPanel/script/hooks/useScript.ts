// src/components/leftPanel/script/hooks/useScript.ts - 脚本操作逻辑
import { useCallback, useState } from 'react';
import { vectorApi } from '../../../../api';
import { ScriptScene, ScriptData } from '../types';

// 解析脚本文本
export const parseScriptText = (text: string): ScriptData => {
  const scenes: ScriptScene[] = [];
  const lines = text.split('\n');
  
  let currentScene: ScriptScene | null = null;
  let currentField: 'summary' | 'shots' | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // 检测场景标题
    if (trimmed.startsWith('【场景') || trimmed.startsWith('【第') || trimmed.match(/^\d+[.、]/)) {
      if (currentScene) {
        scenes.push(currentScene);
      }
      const name = trimmed.replace(/【|】/g, '').trim();
      currentScene = {
        id: `scene_${scenes.length + 1}`,
        name,
        summary: '',
        shots: ''
      };
      currentField = 'summary';
      continue;
    }
    
    // 检测字段标题
    if (trimmed.startsWith('【场次概述】') || trimmed.startsWith('【概述】')) {
      currentField = 'summary';
      continue;
    }
    
    if (trimmed.startsWith('【分镜内容】') || trimmed.startsWith('【分镜】')) {
      currentField = 'shots';
      continue;
    }
    
    // 添加内容
    if (currentScene && currentField) {
      if (currentField === 'summary') {
        currentScene.summary += trimmed + '\n';
      } else {
        currentScene.shots += trimmed + '\n';
      }
    }
  }
  
  if (currentScene) {
    scenes.push(currentScene);
  }
  
  return {
    scenes,
    overview: ''
  };
};

// AI 分析脚本
export const useScriptAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeScript = useCallback(async (scriptContent: string, projectId: number, userId: number) => {
    setIsAnalyzing(true);
    try {
      const response = await vectorApi.analyzeScript(scriptContent, projectId, userId);
      return response;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyzeScript, isAnalyzing };
};

// 导入 hooks
export { useCallback, useState };
