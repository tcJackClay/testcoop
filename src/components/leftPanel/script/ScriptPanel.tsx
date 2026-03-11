import { useState, useEffect } from 'react';
import { 
  X, Upload, FileText, Sparkles, Package, Wand2,
  ListOrdered, ChevronDown, Check, File,
  Users, Network, BookOpen, ScrollText, Box
} from 'lucide-react';

import { scriptApi, episodeScriptApi } from '../../../api';
import { useProjectStore } from '../../../stores/projectStore';
import { useEpisodeStore, Episode } from '../../../stores/episodeStore';
import { splitScriptIntoEpisodes } from './scriptUtils';

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
  // 从 store 读取 episodes 列表和 store 中的选中状态
  const { episodes, selectedEpisodeId, loadEpisodes } = useEpisodeStore();
  
  // ScriptPanel 自己的选中状态（局部状态，不会影响 StoryboardNode）
  const [localSelectedEpisodeId, setLocalSelectedEpisodeId] = useState<string>('');
  
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptContent, setScriptContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType>('extractAssets');
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('script');
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScriptFile(file);
    const content = await file.text();
    setScriptContent(content);
  };

  const handleSplitEpisodes = async () => {
    if (!scriptContent || !currentProjectId) {
      alert('请先上传剧本文件');
      return;
    }

    setIsAnalyzing(true);

    try {
      const splitEpisodes = splitScriptIntoEpisodes(scriptContent);
      
      const resultData: SplitResult = {
        episodes: splitEpisodes,
        totalEpisodes: splitEpisodes.length,
        originalContent: scriptContent
      };

      try {
        await episodeScriptApi.create(
          `剧本分集_${new Date().toLocaleDateString()}`,
          resultData,
          currentProjectId
        );
      } catch (saveError) {
        console.error('保存分集剧本失败:', saveError);
      }

      // 重新加载分集
      await loadEpisodes(currentProjectId);
      if (splitEpisodes.length > 0) {
        setLocalSelectedEpisodeId(String(splitEpisodes[0].id));
      }
      
      alert(`分集完成！共分割为 ${splitEpisodes.length} 集`);
    } catch (error) {
      console.error('分集失败:', error);
      alert('分集失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!scriptContent || !currentProjectId) {
      alert('请先上传剧本文件');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await scriptApi.analyze({
        scriptContent,
        projectId: currentProjectId,
        options: {
          extractAssets: true,
          generateOutline: true,
          generateCharacterBios: true,
          analyzeRelationships: true,
        }
      });

      if (response.data?.code === 0) {
        // TODO: 处理分析结果
      } else {
        alert(response.data?.msg || '分析失败');
      }
    } catch (error) {
      console.error('分析失败:', error);
      alert('分析失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderTabContent = () => {
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-400" />
          <span className="text-xs font-medium">剧本管理</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-700 transition-colors">
          <X size={12} />
        </button>
      </div>

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

      <div className="flex-1 overflow-y-auto p-2">
        {renderTabContent()}
      </div>

      <div className="p-2 border-t border-gray-700 space-y-2 shrink-0">
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

        <button
          onClick={selectedAction === 'splitEpisodes' ? handleSplitEpisodes : handleAnalyze}
          disabled={!scriptFile || isAnalyzing}
          className="w-full py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-500"
        >
          {isAnalyzing ? (
            <><Sparkles size={12} className="animate-pulse" />处理中...</>
          ) : (
            <><Sparkles size={12} />{selectedAction === 'splitEpisodes' ? '开始分集' : '开始处理'}</>
          )}
        </button>
      </div>
    </div>
  );
}
