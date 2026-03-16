// src/components/leftPanel/script/hooks/useScriptPanel.ts - 脚本面板业务逻辑
import { useState, useCallback, useEffect } from 'react';
import { useProjectStore, useAuthStore, useEpisodeStore } from '../../../../stores';

type ActionType = 'extractAssets' | 'analyzeScript' | 'splitEpisodes' | 'splitScenes' | 'generateShots' | 'transformScript';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuthStore();
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
      //   case 'analyzeScript':
      //     response = await vectorApi.analyzeScript(...)
      // }
      
      // 模拟处理
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(30);
      setCurrentAnalysisStep('AI 分析中...');
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(60);
      setCurrentAnalysisStep('解析结果...');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // 根据不同操作返回不同的模拟结果
      let result: ScriptAnalysisResult;
      
      if (selectedAction === 'extractAssets') {
        // 资产提取结果
        result = {
          assets: {
            characters: [
              { name: '主角A', description: '年轻勇敢的冒险家', type: 'character_primary', role: '主角', background: '出身贫寒的村落' },
              { name: '主角B', description: '聪明的技术天才', type: 'character_primary', role: '主角' },
              { name: '反派C', description: '企图统治世界的黑暗势力', type: 'character_primary', role: '反派' },
              { name: '配角D', description: '主角的导师', type: 'character_secondary', role: '导师' },
            ],
            scenes: [
              { name: '起始村庄', description: '故事开始的地方', type: 'scene_primary', background: '宁静的小村庄' },
              { name: '王城', description: '繁华的首都', type: 'scene_primary', background: '金色皇宫' },
              { name: '黑暗城堡', description: '反派的老巢', type: 'scene_secondary' },
            ],
            props: [
              { name: '魔法剑', description: '传说中的神器', type: 'prop_primary' },
              { name: '传送卷轴', description: '一次性传送道具', type: 'prop_secondary' },
            ],
          },
        };
        setBackendAssets(result.assets as any);
        setActiveResultTab('assets');
      } else if (selectedAction === 'analyzeScript') {
        // 剧本分析结果
        result = {
          characterBios: [
            { name: '主角A', age: '22', background: '出身贫寒的村落，从小梦想成为冒险家', role: '主角' },
            { name: '主角B', age: '24', background: '天才科学家，擅长各种发明', role: '主角' },
            { name: '反派C', age: '45', background: '曾是正义英雄，因误会堕入黑暗', role: '反派' },
          ],
          relationships: [
            { from: '主角A', to: '主角B', type: '挚友', description: '生死之交' },
            { from: '主角A', to: '反派C', type: '宿敌', description: '灭族之仇' },
            { from: '主角B', to: '反派C', type: '对手', description: '科技与魔法的对决' },
          ],
          storyOutline: {
            title: '冒险之旅',
            genre: '奇幻冒险',
            summary: '讲述两位主角踏上寻找传说中魔法之源的旅程，途中对抗黑暗势力的故事。',
            chapters: ['第一章：出发', '第二章：考验', '第三章：成长', '第四章：决战'],
          },
        };
        setActiveResultTab('bios');
      } else if (selectedAction === 'splitEpisodes') {
        // 剧集分集结果
        result = {
          script: `# 第1集：起始之村\n\n【场景1】清晨的村庄... \n【场景2】主角决定踏上旅程...\n\n# 第2集：新的伙伴\n\n【场景1】主角遇到新伙伴...\n【场景2】他们一起面对挑战...\n\n# 第3集：真相大白\n\n【场景1】黑暗势力的真相...\n【场景2】最终决战...`,
        };
        setActiveResultTab('script');
      } else if (selectedAction === 'generateShots') {
        // AI分镜结果
        result = {
          storyboard: `# 分镜1：开场\n\n镜头1：远景 - 宁静的村庄晨景\n- 阳光洒在屋顶\n- 鸟鸣声起\n\n镜头2：近景 - 主角A起床\n- 起床伸懒腰\n- 望向窗外\n\n# 分镜2：出发\n\n镜头1：中景 - 三人集合\n- 主角A、B、导师D\n- 整装待发\n`,
        };
        setActiveResultTab('outline');
      } else {
        // 默认/通用结果
        result = {
          script: `# 第1集\n\n## 场景1：起始村庄\n\n【开场】清晨的阳光洒在村庄...\n\n## 场景2：出发\n\n【准备】主角们整理行装...\n`,
          outline: `# 故事大纲\n\n## 第一章：起源\n- 介绍主角\n- 村庄被袭击\n\n## 第二章：冒险\n- 踏上旅程\n- 遇到伙伴\n`,
        };
        setActiveResultTab('script');
      }
      
      setAnalysisResult(result);
      setAnalysisProgress(100);
      setCurrentAnalysisStep('分析完成');
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
    loadEpisodes,
    loadEpisodeScript,
    handleFileUpload,
    handleAnalyze,
    syncAssetsToBackend,
    clearResult,
    setContent,
  };
};
