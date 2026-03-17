// src/components/leftPanel/script/hooks/useScriptPanel.ts - 脚本面板业务逻辑
import { useState, useCallback, useEffect } from 'react';
import { useProjectStore, useEpisodeStore } from '../../../../stores';
import { vectorApi, episodeScriptApi } from '../../../../api';
import { splitScriptIntoEpisodes } from '../scriptUtils';

type ActionType = 'extractAssets' | 'analyzeScript' | 'splitEpisodes';
type ResultTab = 'assets' | 'bios' | 'relationships' | 'outline' | 'script';

interface ScriptAnalysisResult {
  script?: string;
  storyboard?: string;
  outline?: string;
  characters?: string[];
  scenes?: string[];
  props?: string[];
  assets?: { 
    name: string; 
    description: string; 
    type: string;
    background?: string;
    role?: string;
    variants?: string[];
  }[];
  characterBios?: Array<{
    name: string;
    age?: string;
    background?: string;
    role?: string;
  }>;
  relationships?: Array<{
    from: string;
    to: string;
    type: string;
    description?: string;
  }>;
  storyOutline?: {
    title?: string;
    genre?: string;
    summary?: string;
    chapters?: string[];
  };
}

interface UseScriptPanelOptions {
  onClose?: () => void;
}

export const useScriptPanel = (_options?: UseScriptPanelOptions) => {
  const { currentProjectId } = useProjectStore();
  const { episodes, selectedEpisodeId, loadEpisodes } = useEpisodeStore();

  // Local state
  const [localSelectedEpisodeId, setLocalSelectedEpisodeId] = useState<string>('');
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptContent, setScriptContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType>('extractAssets');
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('assets');
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScriptAnalysisResult | null>(null);
  const [backendAssets, setBackendAssets] = useState<{ characters: any[]; scenes: any[]; props: any[] } | null>(null);

  // Computed
  const currentEpisode = episodes.find(ep => String(ep.id) === localSelectedEpisodeId) || episodes[0];

  // Load backend assets when panel opens
  const loadBackendAssets = useCallback(async () => {
    if (!currentProjectId) return;
    
    try {
      // TODO: 调用后端API获取项目资产
      // const response = await assetApi.getProjectAssets(currentProjectId);
      // if (response.code === 0 && response.data) {
      //   setBackendAssets(response.data);
      // }
      console.log('加载后端资产需要后端 API 支持');
    } catch (error) {
      console.error('加载后端资产失败:', error);
    }
  }, [currentProjectId]);

  // 面板打开时自动加载项目分集和后端资产
  useEffect(() => {
    if (currentProjectId) {
      loadEpisodes(currentProjectId);
      loadBackendAssets();
    }
  }, [currentProjectId, loadEpisodes, loadBackendAssets]);

  // Sync with store
  useEffect(() => {
    if (selectedEpisodeId) {
      setLocalSelectedEpisodeId(selectedEpisodeId);
    } else if (episodes.length > 0 && !localSelectedEpisodeId) {
      setLocalSelectedEpisodeId(String(episodes[0].id));
    }
  }, [selectedEpisodeId, episodes]);

  // Load episode script from backend
  const loadEpisodeScript = useCallback(async (episodeId: number) => {
    if (!currentProjectId) return;
    
    try {
      // 查找对应的分集数据
      const episode = episodes.find(ep => ep.id === episodeId);
      if (episode?.content) {
        setScriptContent(episode.content);
      }
    } catch (error) {
      console.error('加载剧本失败:', error);
    }
  }, [currentProjectId, episodes]);

  // File upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScriptFile(file);
    const text = await file.text();
    setScriptContent(text);
  }, []);

  // Analyze script - 接入真实API
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
    setCurrentAnalysisStep('正在提交任务...');

    try {
      // 剧集分集 - 使用前端正则实现
      if (selectedAction === 'splitEpisodes') {
        setCurrentAnalysisStep('智能分集中...');
        setAnalysisProgress(30);
        
        // 使用前端正则分集逻辑
        const episodes = splitScriptIntoEpisodes(scriptContent);
        
        setAnalysisProgress(60);
        setCurrentAnalysisStep('保存分集数据...');
        
        // 调用后端API保存分集结果
        const userId = 1; // TODO: 从authStore获取
        await episodeScriptApi.create(
          '分集剧本',
          { episodes },
          currentProjectId,
          userId
        );
        
        setAnalysisProgress(100);
        setCurrentAnalysisStep('分集完成');
        
        // 更新本地状态
        setAnalysisResult({
          script: episodes.map(ep => `# ${ep.title}\n\n${ep.content}`).join('\n\n')
        });
        setActiveResultTab('script');
        
        // 刷新分集列表
        loadEpisodes(currentProjectId);
        return;
      }

      // 提取资产 / 剧本分析 - 调用向量引擎API
      const type = selectedAction === 'extractAssets' ? 1 : 2;
      const actionLabel = selectedAction === 'extractAssets' ? '提取资产' : '剧本分析';
      
      setCurrentAnalysisStep(`${actionLabel}中...`);
      setAnalysisProgress(40);

      // 调用向量引擎API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await vectorApi.chatCompletion({
        type: type as 1 | 2,
        prompt: scriptContent,
      }, 180000);

      setAnalysisProgress(80);
      setCurrentAnalysisStep('解析结果...');

      if (response.code === 0 && response.data) {
        const resultText = response.data;
        
        // 解析JSON结果
        try {
          const parsed = JSON.parse(resultText);
          
          if (selectedAction === 'extractAssets') {
            setBackendAssets(parsed);
            setActiveResultTab('assets');
          } else {
            setAnalysisResult(parsed);
            setActiveResultTab('bios');
          }
        } catch {
          // 如果不是JSON，直接显示文本结果
          setAnalysisResult({ script: resultText });
          setActiveResultTab('script');
        }
        
        setAnalysisProgress(100);
        setCurrentAnalysisStep(`${actionLabel}完成`);
      } else {
        throw new Error(response.message || 'API调用失败');
      }
      
    } catch (error) {
      setAnalysisError(`分析失败: ${(error as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [scriptContent, selectedAction, currentProjectId, loadEpisodes]);

  // Sync assets to backend (TODO: 需要后端 API 支持)
  const syncAssetsToBackend = useCallback(async (_result: ScriptAnalysisResult, _projectId: number) => {
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
    loadEpisodes,
    loadEpisodeScript,
    loadBackendAssets,
    handleFileUpload,
    handleAnalyze,
    syncAssetsToBackend,
    clearResult,
    setContent,
  };
};
