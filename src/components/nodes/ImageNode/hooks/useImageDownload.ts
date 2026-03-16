/**
 * useImageDownload - 图片下载逻辑
 */
import { useCallback } from 'react';

interface UseImageDownloadOptions {
  displayImageUrl: string;
}

export function useImageDownload({ displayImageUrl }: UseImageDownloadOptions) {
  const handleDownload = useCallback(() => {
    if (!displayImageUrl) return;

    const link = document.createElement('a');
    link.href = displayImageUrl;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [displayImageUrl]);

  return {
    handleDownload,
  };
}
