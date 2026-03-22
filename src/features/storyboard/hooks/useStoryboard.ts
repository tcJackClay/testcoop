import { useCallback, useState } from 'react';
import { useStoryboardStore } from '../../../stores';

export const useStoryboardEditor = () => {
  const store = useStoryboardStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeScript = useCallback(
    async (scriptContent: string) => {
      if (!scriptContent) return;

      setIsAnalyzing(true);
      try {
        store.importFromScript(scriptContent);
        return store.shots;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [store]
  );

  const exportToJson = useCallback(() => {
    const data = {
      shots: store.shots,
      selectedShotId: store.selectedShotId,
      storyboardMode: store.storyboardMode,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyboard.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [store.selectedShotId, store.shots, store.storyboardMode]);

  return {
    ...store,
    isAnalyzing,
    analyzeScript,
    exportToJson,
  };
};
