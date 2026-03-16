/**
 * ProcessInfo - 处理信息显示
 */
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessInfoProps {
  processInfo?: string;
  isProcessing: boolean;
  status?: string;
  onRetry?: () => void;
}

export function ProcessInfo({ processInfo, isProcessing, status, onRetry }: ProcessInfoProps) {
  if (!processInfo && !isProcessing) return null;

  return (
    <div className="absolute bottom-2 left-2 z-10">
      <div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-[9px] text-white flex items-center gap-1">
        {isProcessing ? (
          <React.Fragment>
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span>处理中...</span>
          </React.Fragment>
        ) : status === 'upload_failed' ? (
          <React.Fragment>
            <span className="text-red-400">上传失败</span>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="ml-1 text-blue-400 hover:text-blue-300 underline"
              >
                重试
              </button>
            )}
          </React.Fragment>
        ) : (
          <span>{processInfo}</span>
        )}
      </div>
    </div>
  );
}
