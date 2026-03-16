/**
 * useImageFetch - 图片获取逻辑
 */
import { useState, useEffect } from 'react';
import { imageApi } from '@/api/image';
import type { ProcessChainItem } from '../ImageNode.types';

interface UseImageFetchOptions {
  imageUrl?: string;
  assetId?: number;
  processChain?: ProcessChainItem[];
  ex2?: string;
}

export function useImageFetch({ imageUrl, assetId, processChain, ex2 }: UseImageFetchOptions) {
  const [displayImageUrl, setDisplayImageUrl] = useState<string>('');
  const [processChainImages, setProcessChainImages] = useState<Array<{type: string; url: string}>>([]);

  // 确定显示的图片 URL
  useEffect(() => {
    const fetchImage = async () => {
      // 1. 优先使用 imageUrl
      if (imageUrl) {
        // 如果是可直接使用的 URL，直接使用
        if (
          imageUrl.startsWith('data:') || 
          imageUrl.startsWith('blob:') ||
          imageUrl.startsWith('http://') || 
          imageUrl.startsWith('https://')
        ) {
          setDisplayImageUrl(imageUrl);
          return;
        }
        
        // 如果是数字 ID，使用统一方法获取显示 URL
        const numId = parseInt(imageUrl);
        if (!isNaN(numId)) {
          try {
            const displayUrl = await imageApi.getDisplayUrl(numId);
            if (displayUrl) {
              setDisplayImageUrl(displayUrl);
              return;
            }
          } catch {}
        }
      }

      // 2. 如果有 assetId，获取显示 URL
      if (assetId) {
        try {
          const displayUrl = await imageApi.getDisplayUrl(assetId);
          if (displayUrl) {
            setDisplayImageUrl(displayUrl);
            return;
          }
        } catch {}
      }

      setDisplayImageUrl('');
    };

    fetchImage();
  }, [imageUrl, assetId]);

  // 获取处理链图片
  useEffect(() => {
    const chain = processChain || (ex2 ? JSON.parse(ex2) : []) as ProcessChainItem[];
    
    if (chain.length > 0) {
      const fetchChainImages = async () => {
        const images: Array<{type: string; url: string}> = [];
        for (const item of chain) {
          if (item.targetId) {
            try {
              const displayUrl = await imageApi.getDisplayUrl(item.targetId);
              if (displayUrl) {
                images.push({ type: item.type, url: displayUrl });
              }
            } catch {}
          }
        }
        setProcessChainImages(images);
      };
      fetchChainImages();
    } else {
      setProcessChainImages([]);
    }
  }, [processChain, ex2]);

  return {
    displayImageUrl,
    processChainImages,
  };
}
