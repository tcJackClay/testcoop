import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  Package, 
  Wand2,
  ListOrdered,
  ChevronDown,
  Check,
  File,
  Users,
  Network,
  BookOpen,
  ScrollText,
  Box
} from 'lucide-react';

interface ScriptPanelProps {
  onClose: () => void;
}

type ActionType = 'extractAssets' | 'analyzeScript' | 'splitEpisodes';
type ResultTab = 'assets' | 'bios' | 'relationships' | 'outline' | 'script';

export default function ScriptPanel({ onClose }: ScriptPanelProps) {
  const { t } = useTranslation();
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType>('extractAssets');
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('assets');
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScriptFile(file);
  };

  const handleAnalyze = async () => {
    if (!scriptFile) return;
    
    setIsAnalyzing(true);
    try {
      console.log('Action:', selectedAction, 'file:', scriptFile.name);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setHasResults(true);
      
      switch (selectedAction) {
        case 'extractAssets':
          alert('资产提取功能开发中...');
          break;
        case 'analyzeScript':
          alert('剧本分析功能开发中...');
          break;
        case 'splitEpisodes':
          alert('剧集分集功能开发中...');
          break;
      }
    } catch (error) {
      console.error('Script analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const actionOptions = [
    { 
      key: 'extractAssets', 
      label: '资产提取', 
      icon: <Package size={12} />,
      desc: '提取角色、场景、道具'
    },
    { 
      key: 'analyzeScript', 
      label: '剧本分析', 
      icon: <Wand2 size={12} />,
      desc: '生成大纲、人物小传'
    },
    { 
      key: 'splitEpisodes', 
      label: '剧集分集', 
      icon: <ListOrdered size={12} />,
      desc: '智能分集、剧情概要'
    },
  ];

  const resultTabs = [
    { key: 'assets', label: '资产', icon: <Box size={10} /> },
    { key: 'bios', label: '人物', icon: <Users size={10} /> },
    { key: 'relationships', label: '关系', icon: <Network size={10} /> },
    { key: 'outline', label: '大纲', icon: <BookOpen size={10} /> },
    { key: 'script', label: '剧本', icon: <ScrollText size={10} /> },
  ];

  const selectedOption = actionOptions.find(o => o.key === selectedAction);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-400" />
          <span className="text-xs font-medium">剧本管理</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* Top: Result Tabs (5 tabs like huanu-workbench-frontend) */}
      {hasResults && (
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
                {tab.icon}
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
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content - Analysis Results */}
      <div className="flex-1 overflow-y-auto p-2">
        {hasResults ? (
          <div className="text-[10px] text-gray-400 text-center py-4">
            {activeResultTab === 'assets' && '资产整理内容...'}
            {activeResultTab === 'bios' && '人物小传内容...'}
            {activeResultTab === 'relationships' && '人物关系内容...'}
            {activeResultTab === 'outline' && '故事大纲内容...'}
            {activeResultTab === 'script' && '当前剧本内容...'}
          </div>
        ) : (
          <div className="text-[10px] text-gray-500 text-center py-4">
            上传剧本并分析后显示结果
          </div>
        )}
      </div>

      {/* Bottom Section - Action Dropdown & Upload */}
      <div className="p-2 border-t border-gray-700 space-y-2 shrink-0">
        {/* Single Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowActionDropdown(!showActionDropdown)}
            className="w-full p-2 rounded-lg border border-gray-600 bg-gray-800/50 flex items-center gap-2 text-left hover:border-gray-500 transition-colors"
          >
            <div className="p-1 rounded bg-gray-700 text-gray-400">
              {selectedOption?.icon}
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
                  <div className={selectedAction === option.key ? 'text-blue-300' : ''}>
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload */}
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
                <span className="text-[10px] text-green-300 font-medium truncate max-w-full">
                  {scriptFile.name}
                </span>
              </>
            ) : (
              <>
                <Upload size={14} className="text-gray-500" />
                <span className="text-[10px] text-gray-400">
                  上传剧本文件
                </span>
              </>
            )}
          </label>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!scriptFile || isAnalyzing}
          className="w-full py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-500"
        >
          {isAnalyzing ? (
            <>
              <Sparkles size={12} className="animate-pulse" />
              处理中...
            </>
          ) : (
            <>
              <Sparkles size={12} />
              {selectedAction === 'splitEpisodes' ? '开始分集' : '开始处理'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
