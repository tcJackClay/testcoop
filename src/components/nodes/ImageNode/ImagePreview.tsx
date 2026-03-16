/**
 * ImagePreview - 图片预览区域
 */
import { Upload, Loader2 } from 'lucide-react';

interface ImagePreviewProps {
  displayImageUrl: string;
  isProcessing: boolean;
  onUpload: () => void;
  onMouseDown?: () => void;
  onMouseMove?: () => void;
  onClick?: () => void;
}

export function ImagePreview({
  displayImageUrl,
  isProcessing,
  onUpload,
  onMouseDown,
  onMouseMove,
  onClick,
}: ImagePreviewProps) {
  const hasImage = !!displayImageUrl;

  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center bg-gray-800 overflow-hidden rounded-lg ${!isProcessing ? 'cursor-pointer' : ''}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onClick={!isProcessing ? onClick : undefined}
    >
      {hasImage ? (
        <img src={displayImageUrl} alt="Preview" className="w-full h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Upload className="w-10 h-10" />
          <span className="text-xs">点击上传图片</span>
        </div>
      )}
      
      {/* 悬浮上传提示 */}
      {hasImage && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
            <Upload className="w-5 h-5 text-white" />
          </div>
        </div>
      )}
      
      {/* 生成中遮罩 */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            <span className="text-xs text-gray-300">生成中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
