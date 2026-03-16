/**
 * ImageToolbar - 工具栏组件
 */
import { Upload, Sparkles, Maximize2, Eraser, Download, Loader2 } from 'lucide-react';

interface ImageToolbarProps {
  isProcessing: boolean;
  hasImage: boolean;
  isUpscaling: boolean;
  showSettings: boolean;
  onUpload: () => void;
  onGenerate: () => void;
  onUpscale: () => void;
  onRemoveWatermark: () => void;
  onDownload: () => void;
  onToggleSettings: () => void;
}

export function ImageToolbar({
  isProcessing,
  hasImage,
  isUpscaling,
  showSettings,
  onUpload,
  onGenerate,
  onUpscale,
  onRemoveWatermark,
  onDownload,
  onToggleSettings,
}: ImageToolbarProps) {
  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-lg border border-gray-700">
      {/* 上传按钮 */}
      <button
        onClick={onUpload}
        disabled={isProcessing}
        className={`p-1 rounded-full transition-colors ${
          isProcessing 
            ? 'text-gray-600 cursor-not-allowed' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        title="上传图片"
      >
        <Upload className="w-3 h-3" />
      </button>

      <div className="w-px h-3 bg-gray-600" />

      {/* 生成按钮 */}
      <button
        onClick={() => !isProcessing && onToggleSettings()}
        disabled={isProcessing}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors ${
          isProcessing 
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
            : showSettings 
              ? 'bg-pink-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        <Sparkles className="w-2.5 h-2.5" />
        <span>生成</span>
      </button>

      <div className="w-px h-3 bg-gray-600" />

      {/* 高清放大按钮 */}
      <button
        onClick={onUpscale}
        disabled={!hasImage || isUpscaling}
        className={`p-1 rounded-full transition-colors ${
          hasImage && !isUpscaling 
            ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
            : 'text-gray-600 cursor-not-allowed'
        }`}
        title="高清放大"
      >
        {isUpscaling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Maximize2 className="w-3 h-3" />}
      </button>

      {/* 去水印按钮 */}
      <button
        onClick={onRemoveWatermark}
        disabled={!hasImage}
        className={`p-1 rounded-full transition-colors ${
          hasImage 
            ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
            : 'text-gray-600 cursor-not-allowed'
        }`}
        title="去水印"
      >
        <Eraser className="w-3 h-3" />
      </button>

      <div className="w-px h-3 bg-gray-600" />

      {/* 下载按钮 */}
      <button
        onClick={onDownload}
        disabled={!hasImage}
        className={`p-1 rounded-full transition-colors ${
          hasImage 
            ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
            : 'text-gray-600 cursor-not-allowed'
        }`}
        title="下载图片"
      >
        <Download className="w-3 h-3" />
      </button>
    </div>
  );
}
