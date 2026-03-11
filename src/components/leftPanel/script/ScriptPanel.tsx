import { useState, useEffect, useCallback } from 'react';
import { 
  X, Upload, FileText, Sparkles, Package, Wand2,
  ListOrdered, ChevronDown, Check, File,
  Users, Network, BookOpen, ScrollText, Box
} from 'lucide-react';

import { scriptApi, episodeScriptApi, imageApi, vectorApi } from '../../../api';
import { useProjectStore } from '../../../stores/projectStore';
import { useAuthStore } from '../../../stores/authStore';
import { useEpisodeStore, Episode } from '../../../stores/episodeStore';
import { splitScriptIntoEpisodes } from './scriptUtils';
import { 
  transformAssetResponse, 
  transformAnalysisResponse, 
  cleanJsonString, 
  tryFixIncompleteJson 
} from './scriptTransformers';
import { ScriptAnalysisResult } from '../../../types/scriptAnalysis';

interface ScriptPanelProps {
  onClose: () => void;
}

type ActionType = 'extractAssets' | 'analyzeScript' | 'splitEpisodes';
type ResultTab = 'assets' | 'bios' | 'relationships' | 'outline' | 'script';

const actionOptions = [
  { key: 'extractAssets', label: '资产提取', icon: Package, desc: '提取角色、场景、道具' },
  { key: 'analyzeScript', label: '剧本分析', icon: Wand2, desc: '生成大纲、人物小传' },
  { key: 'splitEpisodes', label: '剧集分集', icon: ListOrdered, desc: '智能分集、剧情概要' },
];

const resultTabs = [
  { key: 'assets', label: '资产', icon: Box },
  { key: 'bios', label: '人物', icon: Users },
  { key: 'relationships', label: '关系', icon: Network },
  { key: 'outline', label: '大纲', icon: BookOpen },
  { key: 'script', label: '剧本', icon: ScrollText },
];

interface SplitResult {
  episodes: Episode[];
  totalEpisodes: number;
  originalContent: string;
}

export default function ScriptPanel({ onClose }: ScriptPanelProps) {
  const { currentProjectId } = useProjectStore();
  const { user } = useAuthStore();
  // 从 store 读取 episodes 列表和 store 中的选中状态
  const { episodes, selectedEpisodeId, loadEpisodes } = useEpisodeStore();
  
  // ScriptPanel 自己的选中状态（局部状态，不会影响 StoryboardNode）
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
  
  // 分析结果状态
  const [analysisResult, setAnalysisResult] = useState<ScriptAnalysisResult | null>(null);
  
  // 后端资产状态
  const [backendAssets, setBackendAssets] = useState<{
    characters: any[];
    scenes: any[];
    props: any[];
  } | null>(null);
  
  // 使用局部状态 + store 中的 episodes
  const currentEpisode = episodes.find(ep => String(ep.id) === localSelectedEpisodeId) || episodes[0];
  const selectedOption = actionOptions.find(o => o.key === selectedAction);

  // 监听 store 中 selectedEpisodeId 变化（StoryboardNode 改变时同步到 ScriptPanel）
  useEffect(() => {
    if (selectedEpisodeId) {
      setLocalSelectedEpisodeId(selectedEpisodeId);
    }
  }, [selectedEpisodeId]);

  // 加载分集剧本 - 使用 store
  useEffect(() => {
    if (currentProjectId) {
      loadEpisodes(currentProjectId).then(() => {
        // 加载完成后，选中第一个分集
        if (episodes.length > 0) {
          setLocalSelectedEpisodeId(String(episodes[0].id));
        }
      });
    }
  }, [currentProjectId, loadEpisodes]);

  // 加载后端资产
  useEffect(() => {
    const loadBackendAssets = async () => {
      if (!currentProjectId) return;
      
      try {
        const assets = await imageApi.getAll(currentProjectId);
        console.log('[ScriptPanel] 原始资产数据:', assets);
        
        if (assets && assets.length > 0) {
          // 按类型分类资产
          const primaryCharacters: any[] = [];
          const secondaryCharacters: any[] = [];
          const primaryScenes: any[] = [];
          const secondaryScenes: any[] = [];
          const primaryProps: any[] = [];
          const secondaryProps: any[] = [];
          
          // 用于去重
          const addedNames = new Set<string>();
          
          for (const asset of assets) {
            // 解析 ext1
            let ext1Info: any = {};
            try {
              if (asset.ext1) {
                ext1Info = JSON.parse(asset.ext1);
              }
            } catch (e) {
              ext1Info = { type: asset.ext1 };
            }
            
            console.log('[ScriptPanel] 资产:', asset.resourceName, 'ext1:', JSON.stringify(ext1Info));
            
            const resourceName = asset.resourceName || '';
            const type = (ext1Info.type || '').toLowerCase();
            
            // 检查是否是变体（名称中包含 " - "）
            const isVariant = resourceName.includes(' - ');
            
            // 只保留主体资产
            if (isVariant) continue;
            if (addedNames.has(resourceName)) continue;
            addedNames.add(resourceName);
            
            // 判断是主要还是次要
            const isSecondary = type.includes('secondary');
            
            // 获取描述信息 - 优先使用 background 或 role
            const description = ext1Info.background || ext1Info.description || '';
            const role = ext1Info.role || '';
            
            // 根据 ext1 的 type 分类
            if (type.includes('character') || type.includes('role')) {
              if (isSecondary) {
                secondaryCharacters.push({
                  id: asset.id,
                  name: resourceName,
                  description: description,
                  background: ext1Info.background || '',
                  role: role,
                  type: type
                });
              } else {
                primaryCharacters.push({
                  id: asset.id,
                  name: resourceName,
                  description: description,
                  background: ext1Info.background || '',
                  role: role,
                  type: type
                });
              }
            } else if (type.includes('scene') || type.includes('location')) {
              if (isSecondary) {
                secondaryScenes.push({
                  id: asset.id,
                  name: resourceName,
                  description: description,
                  background: ext1Info.background || '',
                  type: type
                });
              } else {
                primaryScenes.push({
                  id: asset.id,
                  name: resourceName,
                  description: description,
                  background: ext1Info.background || '',
                  type: type
                });
              }
            } else if (type.includes('prop') || type.includes('item')) {
              if (isSecondary) {
                secondaryProps.push({
                  id: asset.id,
                  name: resourceName,
                  description: description,
                  background: ext1Info.background || '',
                  type: type
                });
              } else {
                primaryProps.push({
                  id: asset.id,
                  name: resourceName,
                  description: description,
                  background: ext1Info.background || '',
                  type: type
                });
              }
            }
          }
          
          // 合并主要和次要 - 主角优先排序
          const sortByRole = (a: any, b: any) => {
            const aIsMain = (a.role?.includes('主角') || a.background?.includes('主角') || a.description?.includes('主角')) ? 0 : 1;
            const bIsMain = (b.role?.includes('主角') || b.background?.includes('主角') || b.description?.includes('主角')) ? 0 : 1;
            return aIsMain - bIsMain;
          };
          
          const characters = [...primaryCharacters.sort(sortByRole), ...secondaryCharacters];
          const scenes = [...primaryScenes, ...secondaryScenes];
          const props = [...primaryProps, ...secondaryProps];
          
          setBackendAssets({ characters, scenes, props });
          console.log('[ScriptPanel] 后端资产加载完成:', { 
            primaryCharacters: primaryCharacters.length, 
            secondaryCharacters: secondaryCharacters.length,
            primaryScenes: primaryScenes.length,
            secondaryScenes: secondaryScenes.length,
            primaryProps: primaryProps.length,
            secondaryProps: secondaryProps.length
          });
        }
      } catch (error) {
        console.error('[ScriptPanel] 加载后端资产失败:', error);
      }
    };
    
    loadBackendAssets();
  }, [currentProjectId]);

  // ============================================
  // 同步资产到后端
  // ============================================
  const syncAssetsToBackend = useCallback(async (result: ScriptAnalysisResult, projectId: number) => {
    const userId = user?.id || 1;
    const username = user?.username || 'system';
    
    const requests: Array<any> = [];
    
    const processAssets = (assets: any[] | undefined, _type: string, ext1Type: string) => {
      if (!assets || !Array.isArray(assets)) return;
      for (const item of assets) {
        // 主资产记录 - 保存完整信息到 ext1
        requests.push({
          resourceName: item.name || '未命名',
          resourceType: 'image',
          resourceContent: '',
          projectId,
          userId,
          ext1: JSON.stringify({ 
            id: item.id, 
            name: item.name, 
            type: ext1Type,
            description: item.description || item.background || '',
            background: item.background || '',
            role: item.role || ''
          }),
          createdBy: username,
          updatedBy: username,
        });
        
        // 为每个 variant 创建独立记录
        for (const variant of item.variants || []) {
          requests.push({
            resourceName: `${item.name} - ${variant}`,
            resourceType: 'image',
            resourceContent: '',
            projectId,
            userId,
            ext1: JSON.stringify({ name: item.name, variant, type: ext1Type }),
            createdBy: username,
            updatedBy: username,
          });
        }
      }
    };
    
    // 后端返回的数据结构可能是：
    // 1. { characters: [...], secondaryCharacters: [...] } - 直接数组
    // 2. { characters: { primary: [...], secondary: [...] } } - 嵌套对象
    const assetsData = result.assets as any;
    
    console.log('[ScriptPanel] syncAssetsToBackend 接收到的数据:', assetsData);
    
    // 直接处理数据
    const chars = Array.isArray(assetsData?.characters) ? assetsData.characters : 
                  Array.isArray(assetsData?.characters?.primary) ? assetsData.characters.primary : [];
    console.log('[ScriptPanel] 处理角色:', chars.length);
    
    processAssets(chars, 'character', 'character_primary');
    processAssets(Array.isArray(assetsData?.scenes) ? assetsData.scenes : [], 'scene', 'scene_primary');
    processAssets(Array.isArray(assetsData?.props) ? assetsData.props : [], 'prop', 'prop_primary');
    processAssets(Array.isArray(assetsData?.secondaryCharacters) ? assetsData.secondaryCharacters : [], 'character', 'character_secondary');
    processAssets(Array.isArray(assetsData?.secondaryScenes) ? assetsData.secondaryScenes : [], 'scene', 'scene_secondary');
    processAssets(Array.isArray(assetsData?.secondaryProps) ? assetsData.secondaryProps : [], 'prop', 'prop_secondary');
    
    console.log('[ScriptPanel] 同步结果:', requests.length);
    
    if (requests.length === 0) {
      console.log('[ScriptPanel] 没有资产需要同步');
      return;
    }
    
    try {
      const existingAssets = await imageApi.getAll(projectId);
      console.log('[ScriptPanel] 已有资产数量:', existingAssets.length);
      
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const request of requests) {
        try {
          // 查找已存在的资产（按名称匹配）
          const existingIndex = existingAssets.findIndex(
            item => item.resourceName === request.resourceName
          );
          
          console.log('[ScriptPanel] 处理资产:', request.resourceName, '存在?', existingIndex >= 0);
          
          if (existingIndex >= 0) {
            // 资产已存在，更新它
            const existingId = existingAssets[existingIndex].id;
            console.log('[ScriptPanel] 更新资产:', request.resourceName, 'ID:', existingId, 'ext1:', request.ext1);
            
            if (existingId) {
              await imageApi.update(existingId, {
                resourceName: request.resourceName,
                resourceType: request.resourceType,
                ext1: request.ext1,
                ext2: request.ext2,
              });
              updatedCount++;
            } else {
              skippedCount++;
            }
          } else {
            // 资产不存在，创建新资产
            console.log('[ScriptPanel] 创建资产:', request.resourceName, 'ext1:', request.ext1);
            await imageApi.create(request);
            createdCount++;
          }
        } catch (error) {
          console.error('[ScriptPanel] ❌ 同步资产失败:', request.resourceName, error);
        }
      }
      console.log('[ScriptPanel] 资产同步完成，创建:', createdCount, '个，更新:', updatedCount, '个');
    } catch (error) {
      console.error('[ScriptPanel] 获取已有资产失败:', error);
    }
  }, [user]);

  // ============================================
  // 同步故事大纲到后端
  // ============================================
  const syncStoryOutlineToBackend = useCallback(async (result: ScriptAnalysisResult, projectId: number) => {
    const userId = user?.id || 1;
    const username = user?.username || 'system';
    
    const promises: Promise<any>[] = [];
    
    // 人物小传
    if (result.characterBios && result.characterBios.length > 0) {
      promises.push(
        scriptApi.saveOutline({
          resourceName: '人物小传',
          resourceContent: JSON.stringify({ characterBios: result.characterBios }),
          projectId,
          userId,
          createdBy: username,
          updatedBy: username,
        })
      );
    }
    
    // 人物关系
    if (result.relationships && result.relationships.length > 0) {
      promises.push(
        scriptApi.saveOutline({
          resourceName: '人物关系',
          resourceContent: JSON.stringify({ relationships: result.relationships }),
          projectId,
          userId,
          createdBy: username,
          updatedBy: username,
        })
      );
    }
    
    // 故事大纲
    if (result.storyOutline) {
      promises.push(
        scriptApi.saveOutline({
          resourceName: '故事大纲',
          resourceContent: JSON.stringify({ storyOutline: result.storyOutline }),
          projectId,
          userId,
          createdBy: username,
          updatedBy: username,
        })
      );
    }
    
    await Promise.all(promises);
    console.log('[ScriptPanel] ✅ 所有分析数据同步完成');
  }, [user]);

  // ============================================
  // 处理文件上传
  // ============================================
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScriptFile(file);
    const content = await file.text();
    setScriptContent(content);
  };

  // ============================================
  // 处理剧集分集
  // ============================================
  const handleSplitEpisodes = async () => {
    if (!scriptContent || !currentProjectId) {
      alert('请先上传剧本文件');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentAnalysisStep('正在分割剧本...');

    try {
      const splitEpisodes = splitScriptIntoEpisodes(scriptContent);
      setAnalysisProgress(50);
      
      const resultData: SplitResult = {
        episodes: splitEpisodes,
        totalEpisodes: splitEpisodes.length,
        originalContent: scriptContent
      };

      try {
        await episodeScriptApi.create(
          `剧本分集_${new Date().toLocaleDateString()}`,
          resultData,
          currentProjectId,
          user?.id
        );
      } catch (saveError) {
        console.error('保存分集剧本失败:', saveError);
      }
      
      setAnalysisProgress(80);

      // 重新加载分集
      await loadEpisodes(currentProjectId);
      if (splitEpisodes.length > 0) {
        setLocalSelectedEpisodeId(String(splitEpisodes[0].id));
      }
      
      setAnalysisProgress(100);
      alert(`分集完成！共分割为 ${splitEpisodes.length} 集`);
    } catch (error) {
      console.error('分集失败:', error);
      alert('分集失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ============================================
  // 处理 AI 分析（资产提取/剧本分析）
  // ============================================
  const handleAnalyze = async () => {
    if (!scriptContent || !currentProjectId) {
      alert('请先上传剧本文件');
      return;
    }

    const isAssetExtraction = selectedAction === 'extractAssets';
    const isScriptAnalysis = selectedAction === 'analyzeScript';
    
    console.log('[ScriptPanel] ════════════════════════════════════════');
    console.log('[ScriptPanel] 🎬 开始 AI 分析剧本');
    console.log('[ScriptPanel] 📄 剧本内容长度:', scriptContent.length);

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentAnalysisStep('正在准备分析...');
    setAnalysisError(null);

    try {
      // 创建临时文件用于 API 调用
      const blob = new Blob([scriptContent], { type: 'text/plain' });
      const file = new (window.File || (({}: any) => Blob))( [blob], scriptFile?.name || 'script.txt', { type: 'text/plain' } );
      
      let analysisResult = '';
      
      if (isAssetExtraction) {
        setCurrentAnalysisStep('正在提取资产...');
        setAnalysisProgress(20);
        
        // 调用资产提取 API (type=1) - 文件上传方式
        const response = await vectorApi.chatCompletionFile(file as any, 1) as any;
        console.log('[ScriptPanel] API 响应:', response);
        
        if (response.code === 0 && response.data) {
          analysisResult = response.data;
        } else {
          throw new Error(response.msg || response.data?.msg || '资产提取失败');
        }
      } else if (isScriptAnalysis) {
        setCurrentAnalysisStep('正在分析剧本大纲...');
        setAnalysisProgress(20);
        
        // 调用剧本分析 API (type=2) - 文件上传方式
        const response = await vectorApi.chatCompletionFile(file as any, 2) as any;
        console.log('[ScriptPanel] API 响应:', response);
        
        if (response.code === 0 && response.data) {
          analysisResult = response.data;
        } else {
          throw new Error(response.msg || response.data?.msg || '剧本分析失败');
        }
      }
      
      setAnalysisProgress(40);
      
      // 解析 JSON
      let jsonStr = analysisResult;
      console.log('[ScriptPanel] 原始响应:', typeof jsonStr, jsonStr?.substring?.(0, 500));
      
      if (typeof jsonStr === 'string') {
        // 去除 markdown 代码块标记
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim();
        jsonStr = cleanJsonString(jsonStr);
      }
      
      console.log('[ScriptPanel] 清理后:', jsonStr?.substring?.(0, 500));
      
      setCurrentAnalysisStep('正在解析结果...');
      setAnalysisProgress(60);
      
      let parsedResult: ScriptAnalysisResult;
      
      try {
        const rawData = tryFixIncompleteJson(jsonStr);
        
        if (isAssetExtraction) {
          parsedResult = transformAssetResponse(rawData, currentProjectId);
        } else {
          parsedResult = transformAnalysisResponse(rawData);
        }
      } catch (parseError: any) {
        console.error('[ScriptPanel] ❌ JSON 解析失败:', parseError?.message || parseError);
        parsedResult = {
          id: `analysis_${Date.now()}`,
          projectId: `project_${currentProjectId}`,
          assets: { characters: [], scenes: [], props: [] },
          characterBios: [],
          relationships: [],
          suggestedShotGroups: [],
          overallStyle: { primaryStyle: '待分析', colorPalette: {}, lighting: {} }
        };
      }
      
      setCurrentAnalysisStep('正在保存资产到后端...');
      setAnalysisProgress(80);
      
      // 同步资产到后端 - 更宽松的检查，兼容 AI 返回的各种格式
      const assetsData = parsedResult.assets as any;
      
      // 提取主要资产（兼容多种格式）
      const getPrimaryArray = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.primary) return Array.isArray(data.primary) ? data.primary : [];
        if (data.主要) return Array.isArray(data.主要) ? data.主要 : [];
        return [];
      };
      
      const primaryChars = getPrimaryArray(assetsData?.characters);
      const primaryScenes = getPrimaryArray(assetsData?.scenes);
      const primaryProps = getPrimaryArray(assetsData?.props);
      const secondaryChars = getPrimaryArray(assetsData?.characters?.secondary);
      const secondaryScenes = getPrimaryArray(assetsData?.scenes?.secondary);
      const secondaryProps = getPrimaryArray(assetsData?.props?.secondary);
      
      const hasAssets = primaryChars.length > 0 || primaryScenes.length > 0 || primaryProps.length > 0 ||
                        secondaryChars.length > 0 || secondaryScenes.length > 0 || secondaryProps.length > 0;
      
      console.log('[ScriptPanel] 检查资产是否存在:', { 
        primaryChars: primaryChars.length, 
        primaryScenes: primaryScenes.length,
        primaryProps: primaryProps.length,
        secondaryChars: secondaryChars.length,
        hasAssets 
      });
      
      if (parsedResult.assets && hasAssets) {
        console.log('[ScriptPanel] 开始同步资产到后端...');
        try {
          await syncAssetsToBackend(parsedResult, currentProjectId);
          console.log('[ScriptPanel] syncAssetsToBackend 完成');
        } catch (syncErr) {
          console.error('[ScriptPanel] syncAssetsToBackend 错误:', syncErr);
        }
        
        // 同步后重新加载资产列表 - 直接调用 imageApi 获取最新数据
        try {
          const newAssets = await imageApi.getAll(currentProjectId);
          // 手动处理返回数据并更新状态
          if (newAssets && newAssets.length > 0) {
            const characters: any[] = [];
            const scenes: any[] = [];
            const props: any[] = [];
            const addedNames = new Set<string>();
            
            for (const asset of newAssets) {
              console.log('[ScriptPanel] 资产原始数据:', asset.resourceName, 'ext1:', asset.ext1);
              let ext1Info: any = {};
              try {
                if (asset.ext1) ext1Info = JSON.parse(asset.ext1);
              } catch (e) { ext1Info = { type: asset.ext1 }; }
              
              const resourceName = asset.resourceName || '';
              const type = (ext1Info.type || '').toLowerCase();
              
              if (resourceName.includes(' - ') || addedNames.has(resourceName)) continue;
              addedNames.add(resourceName);
              
              // 提取 description、background 和 role
              const description = ext1Info.background || ext1Info.description || '';
              const role = ext1Info.role || '';
              
              if (type.includes('character') || type.includes('role')) {
                characters.push({ id: asset.id, name: resourceName, description, background: ext1Info.background || '', role, type });
              } else if (type.includes('scene') || type.includes('location')) {
                scenes.push({ id: asset.id, name: resourceName, description, type });
              } else if (type.includes('prop') || type.includes('item')) {
                props.push({ id: asset.id, name: resourceName, description, type });
              }
            }
            
            setBackendAssets({ characters, scenes, props });
          }
        } catch (syncError) {
          console.error('[ScriptPanel] ⚠️ 资产同步失败:', syncError);
        }
      }
      
      // 同步分析结果到后端
      if (parsedResult.characterBios?.length || parsedResult.relationships?.length || parsedResult.storyOutline) {
        try {
          setCurrentAnalysisStep('正在保存分析结果...');
          await syncStoryOutlineToBackend(parsedResult, currentProjectId);
        } catch (outlineError) {
          console.error('[ScriptPanel] ⚠️ 故事大纲同步失败:', outlineError);
        }
      }
      
      setAnalysisProgress(100);
      setCurrentAnalysisStep('分析完成');
      setAnalysisResult(parsedResult);
      
      // 切换到资产标签页显示结果
      if (isAssetExtraction) {
        setActiveResultTab('assets');
      } else {
        setActiveResultTab('script');
      }
      
    } catch (error) {
      console.error('[ScriptPanel] ❌ AI 分析失败:', error);
      setAnalysisError(error instanceof Error ? error.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ============================================
  // 渲染标签内容
  // ============================================
  const renderTabContent = () => {
    // 优先显示后端资产（如果有）
    if (activeResultTab === 'assets') {
      const assetsToShow = backendAssets || analysisResult?.assets;
      
      if (assetsToShow) {
        const { characters, scenes, props } = assetsToShow;
        
        // 排序函数：主角优先
        const sortByMainRole = (a: any, b: any) => {
          const aIsMain = (a.role?.includes('主角') || a.background?.includes('主角') || a.description?.includes('主角')) ? 0 : 1;
          const bIsMain = (b.role?.includes('主角') || b.background?.includes('主角') || b.description?.includes('主角')) ? 0 : 1;
          return aIsMain - bIsMain;
        };
        
        // 分离主要和次要，并排序
        const primaryChars = (characters?.filter((c: any) => !c.type?.includes('secondary')) || []).sort(sortByMainRole);
        const secondaryChars = characters?.filter((c: any) => c.type?.includes('secondary')) || [];
        const primaryScenes = scenes?.filter((s: any) => !s.type?.includes('secondary')) || [];
        const secondaryScenes = scenes?.filter((s: any) => s.type?.includes('secondary')) || [];
        const primaryProps = props?.filter((p: any) => !p.type?.includes('secondary')) || [];
        const secondaryProps = props?.filter((p: any) => p.type?.includes('secondary')) || [];
        
        return (
          <div className="space-y-3 text-[10px] max-h-96 overflow-y-auto">
            {/* 主要角色 */}
            {primaryChars.length > 0 && (
              <div>
                <div className="text-blue-400 font-medium mb-1">主要角色 ({primaryChars.length})</div>
                <div className="space-y-2 pl-2">
                  {primaryChars.map((char: any, i: number) => (
                    <div key={`primary-${i}`} className="bg-gray-800 p-2 rounded">
                      <div className="text-gray-200 font-medium">{char.name}</div>
                      {char.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{char.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 次要角色 */}
            {secondaryChars.length > 0 && (
              <div>
                <div className="text-blue-300 font-medium mb-1">次要角色 ({secondaryChars.length})</div>
                <div className="space-y-2 pl-2">
                  {secondaryChars.map((char: any, i: number) => (
                    <div key={`secondary-${i}`} className="bg-gray-800 p-2 rounded opacity-70">
                      <div className="text-gray-300 font-medium">{char.name}</div>
                      {char.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{char.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 主要场景 */}
            {primaryScenes.length > 0 && (
              <div>
                <div className="text-green-400 font-medium mb-1">主要场景 ({primaryScenes.length})</div>
                <div className="space-y-2 pl-2">
                  {primaryScenes.map((scene: any, i: number) => (
                    <div key={`primary-${i}`} className="bg-gray-800 p-2 rounded">
                      <div className="text-gray-200 font-medium">{scene.name}</div>
                      {scene.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{scene.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 次要场景 */}
            {secondaryScenes.length > 0 && (
              <div>
                <div className="text-green-300 font-medium mb-1">次要场景 ({secondaryScenes.length})</div>
                <div className="space-y-2 pl-2">
                  {secondaryScenes.map((scene: any, i: number) => (
                    <div key={`secondary-${i}`} className="bg-gray-800 p-2 rounded opacity-70">
                      <div className="text-gray-300 font-medium">{scene.name}</div>
                      {scene.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{scene.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 主要道具 */}
            {primaryProps.length > 0 && (
              <div>
                <div className="text-yellow-400 font-medium mb-1">主要道具 ({primaryProps.length})</div>
                <div className="space-y-2 pl-2">
                  {primaryProps.map((prop: any, i: number) => (
                    <div key={`primary-${i}`} className="bg-gray-800 p-2 rounded">
                      <div className="text-gray-200 font-medium">{prop.name}</div>
                      {prop.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{prop.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 次要道具 */}
            {secondaryProps.length > 0 && (
              <div>
                <div className="text-yellow-300 font-medium mb-1">次要道具 ({secondaryProps.length})</div>
                <div className="space-y-2 pl-2">
                  {secondaryProps.map((prop: any, i: number) => (
                    <div key={`secondary-${i}`} className="bg-gray-800 p-2 rounded opacity-70">
                      <div className="text-gray-300 font-medium">{prop.name}</div>
                      {prop.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{prop.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(primaryChars.length === 0 && secondaryChars.length === 0 && 
              primaryScenes.length === 0 && secondaryScenes.length === 0 && 
              primaryProps.length === 0 && secondaryProps.length === 0) && (
              <div className="text-gray-500 text-center py-4">
                {analysisResult ? '未提取到资产' : '上传剧本后提取资产'}
              </div>
            )}
          </div>
        );
      }
      
      return (
        <div className="text-gray-500 text-center py-4">
          {analysisResult ? '未提取到资产' : '上传剧本后提取资产'}
        </div>
      );
    }
    
    // 显示分析结果中的其他标签
    if (analysisResult) {
      
      if (activeResultTab === 'bios' && analysisResult.characterBios) {
        return (
          <div className="space-y-2 text-[10px] max-h-80 overflow-y-auto">
            {analysisResult.characterBios.map((bio, i) => (
              <div key={i} className="bg-gray-800 p-2 rounded">
                <div className="text-blue-300 font-medium">{bio.name}</div>
                {bio.age && <div className="text-gray-500">年龄: {bio.age}</div>}
                {bio.background && <div className="text-gray-400 mt-1">{bio.background}</div>}
                {bio.role && <div className="text-gray-500">角色: {bio.role}</div>}
              </div>
            ))}
            {analysisResult.characterBios.length === 0 && (
              <div className="text-gray-500 text-center py-4">未提取到人物小传</div>
            )}
          </div>
        );
      }
      
      if (activeResultTab === 'relationships' && analysisResult.relationships) {
        return (
          <div className="space-y-2 text-[10px] max-h-80 overflow-y-auto">
            {analysisResult.relationships.map((rel, i) => (
              <div key={i} className="bg-gray-800 p-2 rounded">
                <div className="text-blue-300">{rel.from}</div>
                <div className="text-gray-500">— {rel.type} —</div>
                <div className="text-green-300">{rel.to}</div>
                {rel.description && <div className="text-gray-400 mt-1">{rel.description}</div>}
              </div>
            ))}
            {analysisResult.relationships.length === 0 && (
              <div className="text-gray-500 text-center py-4">未提取到人物关系</div>
            )}
          </div>
        );
      }
      
      if (activeResultTab === 'outline' && analysisResult.storyOutline) {
        return (
          <div className="space-y-2 text-[10px] max-h-80 overflow-y-auto">
            {analysisResult.storyOutline.title && (
              <div className="text-lg text-blue-300 font-medium">{analysisResult.storyOutline.title}</div>
            )}
            {analysisResult.storyOutline.genre && (
              <div className="text-gray-500">类型: {analysisResult.storyOutline.genre}</div>
            )}
            {analysisResult.storyOutline.summary && (
              <div className="text-gray-300 mt-2">{analysisResult.storyOutline.summary}</div>
            )}
            {analysisResult.storyOutline.chapters && analysisResult.storyOutline.chapters.length > 0 && (
              <div className="mt-2">
                <div className="text-gray-400 font-medium">章节:</div>
                {analysisResult.storyOutline.chapters.map((ch, i) => (
                  <div key={i} className="text-gray-300 pl-2">{ch.title || ch.name || ch}</div>
                ))}
              </div>
            )}
          </div>
        );
      }
    }
    
    // 默认显示剧本内容
    if (activeResultTab === 'script') {
      if (episodes.length > 0) {
        return (
          <div className="space-y-2">
            <select
              value={localSelectedEpisodeId || ''}
              onChange={(e) => setLocalSelectedEpisodeId(e.target.value)}
              className="w-full px-2 py-1.5 text-[10px] bg-gray-800 border border-gray-600 rounded text-gray-300 focus:outline-none focus:border-blue-500"
            >
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.title}</option>
              ))}
            </select>
            <pre className="text-[9px] text-gray-400 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
              {currentEpisode?.content || '暂无内容'}
            </pre>
            <div className="px-1 flex items-center gap-3 text-[8px] text-gray-500">
              <span>共 {episodes.length} 集</span>
              <span>当前: {currentEpisode?.title}</span>
              <span>{currentEpisode?.content?.length || 0} 字</span>
            </div>
          </div>
        );
      }
      
      return (
        <div className="text-[10px] text-gray-500 text-center py-4">
          {scriptFile ? '点击"开始分集"生成分集剧本' : '上传剧本文件后进行分集'}
        </div>
      );
    }

    const tabContent: Record<ResultTab, string> = {
      assets: '资产整理内容...',
      bios: '人物小传内容...',
      relationships: '人物关系内容...',
      outline: '故事大纲内容...',
      script: '当前剧本内容...',
    };
    return <div className="text-[10px] text-gray-400">{tabContent[activeResultTab]}</div>;
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-400" />
          <span className="text-xs font-medium">剧本管理</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-700 transition-colors">
          <X size={12} />
        </button>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-700 shrink-0">
        <div className="flex">
          {resultTabs.slice(0, 3).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveResultTab(tab.key as ResultTab)}
              className={`flex-1 py-1.5 text-[9px] flex items-center justify-center gap-1 transition-colors ${
                activeResultTab === tab.key
                  ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon size={10} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex">
          {resultTabs.slice(3).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveResultTab(tab.key as ResultTab)}
              className={`flex-1 py-1.5 text-[9px] flex items-center justify-center gap-1 transition-colors ${
                activeResultTab === tab.key
                  ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon size={10} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 进度条 */}
      {isAnalyzing && (
        <div className="px-3 py-1 bg-gray-800 shrink-0">
          <div className="text-[8px] text-gray-400 mb-1">{currentAnalysisStep}</div>
          <div className="h-1 bg-gray-700 rounded overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {analysisError && (
        <div className="px-3 py-2 bg-red-900/30 border-b border-red-700 shrink-0">
          <div className="text-[10px] text-red-400">{analysisError}</div>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-2">
        {renderTabContent()}
      </div>

      {/* 底部操作区 */}
      <div className="p-2 border-t border-gray-700 space-y-2 shrink-0">
        {/* 操作选择 */}
        <div className="relative">
          <button
            onClick={() => setShowActionDropdown(!showActionDropdown)}
            className="w-full p-2 rounded-lg border border-gray-600 bg-gray-800/50 flex items-center gap-2 text-left hover:border-gray-500 transition-colors"
          >
            <div className="p-1 rounded bg-gray-700 text-gray-400">
              {selectedOption && <selectedOption.icon size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-300">{selectedOption?.label}</div>
              <div className="text-[8px] text-gray-500 truncate">{selectedOption?.desc}</div>
            </div>
            <ChevronDown size={12} className={`text-gray-500 transition-transform ${showActionDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showActionDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
              {actionOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => {
                    setSelectedAction(option.key as ActionType);
                    setShowActionDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[10px] text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  {selectedAction === option.key && <Check size={10} className="text-blue-400" />}
                  <span className={selectedAction === option.key ? 'text-blue-300' : ''}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 文件上传 */}
        <div className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
          scriptFile ? 'border-green-500/50 bg-green-500/10' : 'border-gray-600 hover:border-blue-500/50'
        }`}>
          <input
            type="file"
            accept=".txt,.md,.json"
            onChange={handleFileUpload}
            className="hidden"
            id="script-upload-panel"
          />
          <label htmlFor="script-upload-panel" className="cursor-pointer flex flex-col items-center gap-1">
            {scriptFile ? (
              <>
                <File size={14} className="text-green-400" />
                <span className="text-[10px] text-green-300 font-medium truncate max-w-full">{scriptFile.name}</span>
              </>
            ) : (
              <>
                <Upload size={14} className="text-gray-500" />
                <span className="text-[10px] text-gray-400">上传剧本文件</span>
              </>
            )}
          </label>
        </div>

        {/* 执行按钮 */}
        <button
          onClick={selectedAction === 'splitEpisodes' ? handleSplitEpisodes : handleAnalyze}
          disabled={!scriptFile || isAnalyzing}
          className="w-full py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-500"
        >
          {isAnalyzing ? (
            <><Sparkles size={12} className="animate-pulse" />{analysisProgress}%</>
          ) : (
            <><Sparkles size={12} />{selectedAction === 'splitEpisodes' ? '开始分集' : '开始处理'}</>
          )}
        </button>
      </div>
    </div>
  );
}
