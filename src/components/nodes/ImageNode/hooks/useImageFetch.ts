/**
 * useImageFetch - 图片获取逻辑
 */
import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
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
        // 如果是 base64 或 data URL，直接使用
        if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
          setDisplayImageUrl(imageUrl);
          return;
        }
        
        // 如果是数字 ID，尝试获取 base64
        const numId = parseInt(imageUrl);
        if (!isNaN(numId)) {
          try {
            const response = await apiClient.get(`/image/${numId}`);
            const res = response.data;
            if (res.code === 0 && res.data) {
              let base64 = res.data;
              if (!base64.startsWith('data:')) {
                base64 = `data:image/png;base64,${base64}`;
              }
              setDisplayImageUrl(base64);
              return;
            }
          } catch {}
        }
      }

      // 2. 如果有 assetId，获取图片
      if (assetId) {
        try {
          const response = await apiClient.get(`/image/${assetId}`);
          const res = response.data;
          if (res.code === 0 && res.data) {
            let base64 = res.data;
            if (!base64.startsWith('data:')) {
              base64 = `data:image/png;base64,${base64}`;
            }
            setDisplayImageUrl(base64);
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
              const response = await apiClient.get(`/image/${item.targetId}`);
              const res = response.data;
              if (res.code === 0 && res.data) {
                let base64 = res.data;
                if (!base64.startsWith('data:')) {
                  base64 = `data:image/png;base64,${base64}`;
                }
                images.push({ type: item.type, url: base64 });
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
