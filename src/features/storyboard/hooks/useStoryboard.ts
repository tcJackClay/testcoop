// src/features/storyboard/hooks/useStoryboard.ts - 故事板业务逻辑
import { useCallback, useEffect, useState } from 'react';
import { useStoryboardStore, type Shot } from '../../../stores';
import { vectorApi } from '../../../api';

export const useStoryboardEditor = () => {
  const store = useStoryboardStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI 分析脚本
  const analyzeScript = useCallback(async (scriptContent: string) => {
    const projectId = store.currentProjectId;
    if (!projectId || !scriptContent) return;

    setIsAnalyzing(true);
    try {
      const response = await vectorApi.analyzeScript(scriptContent, projectId, 1);
      if (response.code === 0 && response.data) {
        // 解析返回的分镜内容
        const content = response.data;
        // 解析为 shotGroups
        // ... 解析逻辑
        return content;
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [store.currentProjectId]);

  // 导出 JSON
  const exportToJson = useCallback(() => {
    const data = {
      episodes: store.episodes,
      shotGroups: store.shotGroups,
      scriptContent: store.scriptContent,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyboard.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [store.episodes, store.shotGroups, store.scriptContent]);

  return {
    ...store,
    isAnalyzing,
    analyzeScript,
    exportToJson,
  };
};
