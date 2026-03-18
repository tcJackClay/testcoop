/**
 * ImageToolbar - 工具栏组件
 */
import { Sparkles, Maximize2, Eraser, Download, Loader2, Sun, RotateCcw } from 'lucide-react';

interface ImageToolbarProps {
  // 统一状态管理
  isProcessing: boolean;
  hasImage: boolean;
  isUpscaling: boolean;
  // 各功能选中状态
  showSettings: boolean;
  activeTool: 'generate' | 'multiAngle' | 'lighting' | 'upscale' | 'removeWatermark' | 'download' | null;
  // 功能回调
  onGenerate: () => void;
  onUpscale: () => void;
  onRemoveWatermark: () => void;
  onDownload: () => void;
  onMultiAngle: () => void;
  onLighting: () => void;
  onToggleSettings: () => void;
}

export function ImageToolbar({
  isProcessing,
  hasImage,
  isUpscaling,
  showSettings,
  activeTool,
  onGenerate,
  onUpscale,
  onRemoveWatermark,
  onDownload,
  onMultiAngle,
  onLighting,
  onToggleSettings,
}: ImageToolbarProps) {
  // 按钮状态判断
  const canEdit = !isProcessing;
  const canEditWithImage = hasImage && !isProcessing;
  const canUpscale = hasImage && !isUpscaling;

  // 按钮样式 - 选中时高亮，未选中无边框
  const getButtonClass = (isActive: boolean, canUse: boolean) => {
    if (!canUse) {
      return 'text-gray-600 cursor-not-allowed';
    }
    if (isActive) {
      return 'bg-pink-500 text-white';
    }
    return 'text-gray-300 hover:text-white';
  };

  return (
    <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-700 shadow-lg">
      {/* 生成按钮 */}
      <button
        onClick={() => !isProcessing && onToggleSettings()}
        disabled={!canEdit}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${getButtonClass(showSettings, canEdit)}`}
        title="AI 生成图片"
      >
        <Sparkles className="w-3 h-3 shrink-0" />
        <span>生成</span>
      </button>

      <div className="w-px h-4 bg-gray-600" />

      {/* 多角度按钮 */}
      <button
        onClick={onMultiAngle}
        disabled={!canEditWithImage}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${getButtonClass(activeTool === 'multiAngle', canEditWithImage)}`}
        title="生成多角度图片"
      >
        <RotateCcw className="w-3 h-3 shrink-0" />
        <span>多角度</span>
      </button>

      {/* 打光按钮 */}
      <button
        onClick={onLighting}
        disabled={!canEditWithImage}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${getButtonClass(activeTool === 'lighting', canEditWithImage)}`}
        title="智能打光"
      >
        <Sun className="w-3 h-3 shrink-0" />
        <span>打光</span>
      </button>

      {/* 高清放大按钮 */}
      <button
        onClick={onUpscale}
        disabled={!canUpscale}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${getButtonClass(activeTool === 'upscale', canUpscale)}`}
        title="高清放大图片"
      >
        {isUpscaling ? <Loader2 className="w-3 h-3 shrink-0 animate-spin" /> : <Maximize2 className="w-3 h-3 shrink-0" />}
        <span>{isUpscaling ? '放大中' : '放大'}</span>
      </button>

      {/* 去水印按钮 */}
      <button
        onClick={onRemoveWatermark}
        disabled={!canEditWithImage}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${getButtonClass(activeTool === 'removeWatermark', canEditWithImage)}`}
        title="移除图片水印"
      >
        <Eraser className="w-3 h-3 shrink-0" />
        <span>去水印</span>
      </button>

      <div className="w-px h-4 bg-gray-600" />

      {/* 下载按钮 */}
      <button
        onClick={onDownload}
        disabled={!hasImage}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${getButtonClass(activeTool === 'download', hasImage)}`}
        title="下载图片到本地"
      >
        <Download className="w-3 h-3 shrink-0" />
        <span>下载</span>
      </button>
    </div>
  );
}
