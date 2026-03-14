// src/components/leftPanel/script/hooks/useScriptPanel.ts - 脚本面板业务逻辑
import { useState, useCallback, useEffect } from 'react';
import { useProjectStore, useAuthStore, useEpisodeStore } from '../../../../stores';

type ActionType = 'extractAssets' | 'splitEpisodes' | 'splitScenes' | 'generateShots' | 'transformScript';
type ResultTab = 'script' | 'storyboard' | 'outline';

interface ScriptAnalysisResult {
  script?: string;
  storyboard?: string;
  outline?: string;
  characters?: string[];
  scenes?: string[];
  props?: string[];
  assets?: { name: string; description: string; type: string }[];
}

interface UseScriptPanelOptions {
  onClose?: () => void;
}

export const useScriptPanel = (_options?: UseScriptPanelOptions) => {
  const { currentProjectId } = useProjectStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuthStore();
  const { episodes, selectedEpisodeId } = useEpisodeStore();

  // Local state
  const [localSelectedEpisodeId, setLocalSelectedEpisodeId] = useState<string>('');
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptContent, setScriptContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType>('extractAssets');
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('script');
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScriptAnalysisResult | null>(null);
  const [backendAssets, setBackendAssets] = useState<{ characters: any[]; scenes: any[]; props: any[] } | null>(null);

  // Computed
  const currentEpisode = episodes.find(ep => String(ep.id) === localSelectedEpisodeId) || episodes[0];

  // Sync with store
  useEffect(() => {
    if (selectedEpisodeId) {
      setLocalSelectedEpisodeId(selectedEpisodeId);
    }
  }, [selectedEpisodeId]);

  // Load episode script (TODO: 需要后端 API 支持)
  const loadEpisodeScript = useCallback(async (_episodeId: number) => {
    // TODO: 实现 loadEpisodeScript
    // const resp = await vectorApi.getEpisodeScript(episodeId);
    console.log('加载剧本需要后端 API 支持');
  }, []);

  // File upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScriptFile(file);
    const text = await file.text();
    setScriptContent(text);
  }, []);

  // Analyze script (TODO: 需要后端 API 支持)
  const handleAnalyze = useCallback(async () => {
    if (!scriptContent.trim()) {
      setAnalysisError('请输入脚本内容');
      return;
    }
    if (!currentProjectId) {
      setAnalysisError('请先选择项目');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress(10);
    setCurrentAnalysisStep('正在分析脚本...');

    try {
      // TODO: 调用后端 API
      // switch (selectedAction) {
      //   case 'extractAssets':
      //     response = await vectorApi.extractAssets(...)
      // }
      
      // 模拟处理
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalysisProgress(50);
      setCurrentAnalysisStep('处理中...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 设置示例结果
      setAnalysisResult({
        script: `# 第1集\n\n## 场景1\n\n【开场】...`,
        storyboard: `# 分镜1\n\n镜头1：...`,
        outline: `# 故事大纲\n\n第一章：...`,
      });
      setAnalysisProgress(100);
    } catch (error) {
      setAnalysisError('分析失败: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [scriptContent, selectedAction, currentProjectId]);

  // Sync assets to backend (TODO: 需要后端 API 支持)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const syncAssetsToBackend = useCallback(async (result: ScriptAnalysisResult, _projectId: number) => {
    // TODO: 实现 syncAssetsToBackend
    // for (const asset of result.assets || []) {
    //   await imageApi.create({...})
    // }
    console.log('同步资产需要后端 API 支持');
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setAnalysisResult(null);
    setBackendAssets(null);
    setAnalysisProgress(0);
    setCurrentAnalysisStep('');
    setAnalysisError(null);
  }, []);

  // Set script content
  const setContent = useCallback((content: string) => {
    setScriptContent(content);
  }, []);

  return {
    // State
    episodes,
    currentEpisode,
    localSelectedEpisodeId,
    setLocalSelectedEpisodeId,
    scriptFile,
    scriptContent,
    setScriptContent,
    isAnalyzing,
    analysisProgress,
    currentAnalysisStep,
    analysisError,
    selectedAction,
    setSelectedAction,
    activeResultTab,
    setActiveResultTab,
    showActionDropdown,
    setShowActionDropdown,
    analysisResult,
    backendAssets,
    
    // Actions
    loadEpisodeScript,
    handleFileUpload,
    handleAnalyze,
    syncAssetsToBackend,
    clearResult,
    setContent,
  };
};
