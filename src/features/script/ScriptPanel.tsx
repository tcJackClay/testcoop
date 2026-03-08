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
  File
} from 'lucide-react';

interface ScriptPanelProps {
  onClose: () => void;
}

type ActionType = 'extractAssets' | 'analyzeScript' | 'splitEpisodes';

export default function ScriptPanel({ onClose }: ScriptPanelProps) {
  const { t } = useTranslation();
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType>('extractAssets');
  
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<ActionType | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setScriptFile(file);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!scriptFile) return;
    
    setIsAnalyzing(true);
    try {
      console.log('Action:', selectedAction, 'file:', scriptFile.name);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Action Dropdowns */}
        {actionOptions.map((option) => (
          <div key={option.key} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === option.key ? null : option.key)}
              className={`w-full p-2 rounded-lg border transition-all flex items-center gap-2 text-left ${
                selectedAction === option.key
                  ? 'bg-blue-500/20 border-blue-500/50' 
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`p-1.5 rounded ${selectedAction === option.key ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-medium ${selectedAction === option.key ? 'text-blue-300' : 'text-gray-300'}`}>
                  {option.label}
                </div>
                <div className="text-[9px] text-gray-500 truncate">
                  {option.desc}
                </div>
              </div>
              <ChevronDown size={12} className={`text-gray-500 transition-transform ${openDropdown === option.key ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === option.key && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedAction(option.key as ActionType);
                    setOpenDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left text-[10px] text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  {selectedAction === option.key && <Check size={10} className="text-blue-400" />}
                  <span className={selectedAction === option.key ? 'text-blue-300' : ''}>选择{option.label}</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Section - Upload & Analyze */}
      <div className="p-3 border-t border-gray-700 space-y-2 shrink-0">
        {/* Upload */}
        <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
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
                <File size={16} className="text-green-400" />
                <span className="text-[10px] text-green-300 font-medium truncate max-w-full">
                  {scriptFile.name}
                </span>
                <span className="text-[9px] text-gray-500">
                  点击重新上传
                </span>
              </>
            ) : (
              <>
                <Upload size={16} className="text-gray-500" />
                <span className="text-[10px] text-gray-400">
                  上传剧本文件
                </span>
                <span className="text-[9px] text-gray-500">
                  支持 .txt, .md, .json
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
