// src/components/leftPanel/script/ScriptPanel.tsx - 脚本面板（精简版）
import { useEffect } from 'react';
import { Upload, Loader2, X, ChevronDown, Save, Sparkles } from 'lucide-react';
import { useProjectStore } from '../../../stores';
import { useScriptPanel } from './hooks';

interface ScriptPanelProps {
  onClose?: () => void;
}

const actionOptions = [
  { key: 'extractAssets', label: '提取资产', prompt: '从脚本中提取角色、场景、道具等资产' },
  { key: 'splitEpisodes', label: '拆分为多集', prompt: '将长剧本拆分为多集' },
  { key: 'splitScenes', label: '拆分为多场景', prompt: '将剧本拆分为多个场景' },
  { key: 'generateShots', label: '生成AI分镜', prompt: '生成详细的AI分镜描述' },
  { key: 'transformScript', label: '格式转换', prompt: '转换为其他格式' },
];

const resultTabs = [
  { key: 'script', label: '分集剧本' },
  { key: 'storyboard', label: 'AI分镜' },
  { key: 'outline', label: '故事大纲' },
];

export default function ScriptPanel({ onClose }: ScriptPanelProps) {
  const { currentProjectId } = useProjectStore();
  
  const {
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
    loadEpisodeScript,
    handleFileUpload,
    handleAnalyze,
    clearResult,
  } = useScriptPanel({ onClose });

  // 加载选中的分集剧本
  useEffect(() => {
    if (localSelectedEpisodeId) {
      loadEpisodeScript(parseInt(localSelectedEpisodeId));
    }
  }, [localSelectedEpisodeId, loadEpisodeScript]);

  const selectedOption = actionOptions.find(o => o.key === selectedAction);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-750">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">AI 脚本助手</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        {/* Episode selector */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">选择分集</label>
          <select
            value={localSelectedEpisodeId}
            onChange={(e) => setLocalSelectedEpisodeId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">选择分集...</option>
            {episodes.map(ep => (
              <option key={ep.id} value={ep.id}>{ep.name || `第${ep.order}集`}</option>
            ))}
          </select>
        </div>

        {/* Action selector */}
        <div className="relative">
          <label className="text-xs text-gray-400 mb-1 block">选择操作</label>
          <button
            onClick={() => setShowActionDropdown(!showActionDropdown)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white flex items-center justify-between"
          >
            <span>{selectedOption?.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showActionDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10">
              {actionOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => { setSelectedAction(option.key as any); setShowActionDropdown(false); clearResult(); }}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-600"
                >
                  <div>{option.label}</div>
                  <div className="text-xs text-gray-400">{option.prompt}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File upload */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">上传脚本文件</label>
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded cursor-pointer hover:bg-gray-600">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">{scriptFile?.name || '选择文件...'}</span>
            <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !scriptContent.trim() || !currentProjectId}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm text-white"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isAnalyzing ? '分析中...' : '开始分析'}
        </button>

        {/* Progress */}
        {isAnalyzing && (
          <div className="space-y-1">
            <div className="h-2 bg-gray-700 rounded overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${analysisProgress}%` }} />
            </div>
            <div className="text-xs text-gray-400">{currentAnalysisStep}</div>
          </div>
        )}

        {/* Error */}
        {analysisError && (
          <div className="text-xs text-red-400 bg-red-900/30 p-2 rounded">{analysisError}</div>
        )}
      </div>

      {/* Result tabs */}
      {analysisResult && (
        <div className="border-b border-gray-700">
          <div className="flex">
            {resultTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveResultTab(tab.key as any)}
                className={`flex-1 px-4 py-2 text-xs ${
                  activeResultTab === tab.key 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result content */}
      <div className="flex-1 overflow-auto p-4">
        {analysisResult ? (
          <textarea
            value={
              activeResultTab === 'script' ? analysisResult.script || '' :
              activeResultTab === 'storyboard' ? analysisResult.storyboard || '' :
              analysisResult.outline || ''
            }
            onChange={(e) => setScriptContent(e.target.value)}
            className="w-full h-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-white resize-none font-mono"
            placeholder="分析结果将显示在这里..."
          />
        ) : (
          <div className="text-center text-gray-500 text-sm py-8">
            选择操作并上传脚本后点击"开始分析"
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 flex justify-between text-xs text-gray-500">
        <span>当前分集: {currentEpisode?.name || '未选择'}</span>
        <span>字符数: {scriptContent.length}</span>
      </div>
    </div>
  );
}
