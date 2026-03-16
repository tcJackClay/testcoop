/**
 * GenerationSettings - 生成设置面板
 */
import { Sparkles, Loader2 } from 'lucide-react';
import { aspectRatioOptions, resolutionOptions } from '../nodeConstants';

interface GenerationSettingsProps {
  prompt: string;
  aspectRatio: string;
  resolution: string;
  isProcessing: boolean;
  onPromptChange: (value: string) => void;
  onAspectRatioChange: (value: string) => void;
  onResolutionChange: (value: string) => void;
  onGenerate: () => void;
}

export function GenerationSettings({
  prompt,
  aspectRatio,
  resolution,
  isProcessing,
  onPromptChange,
  onAspectRatioChange,
  onResolutionChange,
  onGenerate,
}: GenerationSettingsProps) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 p-1.5 bg-gray-800 rounded-lg border border-gray-700 shadow-xl w-48">
      {/* 提示词输入 */}
      <textarea
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-[9px] text-white resize-none mb-1"
        rows={2}
        placeholder="描述你想要生成的画面..."
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
      />
      
      {/* 尺寸配置 + 生成按钮一行 */}
      <div className="flex items-center gap-1">
        <select
          value={aspectRatio}
          onChange={(e) => onAspectRatioChange(e.target.value)}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-[9px] text-white"
        >
          {aspectRatioOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={resolution}
          onChange={(e) => onResolutionChange(e.target.value)}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-[9px] text-white"
        >
          {resolutionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={onGenerate}
          disabled={isProcessing}
          className={`px-2 py-0.5 rounded text-[9px] font-medium flex items-center gap-0.5 ${
            isProcessing 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-pink-500 hover:bg-pink-600 text-white'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <Sparkles className="w-2.5 h-2.5" />
          )}
        </button>
      </div>
    </div>
  );
}
