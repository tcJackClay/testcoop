// ImageNode - AI绘图节点组件
import { useState } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { aspectRatioOptions, resolutionOptions } from './nodeConstants';

interface ImageNodeProps {
  nodeId: string;
  data: {
    imageUrl?: string;
    prompt?: string;
    status?: string;
    aspectRatio?: string;
    resolution?: string;
  };
  updateData: (key: string, value: unknown) => void;
}

export default function ImageNode({ nodeId, data, updateData }: ImageNodeProps) {
  const imageUrl = data.imageUrl as string || '';
  const prompt = data.prompt as string || '';
  const status = data.status as string || 'idle';
  const aspectRatio = data.aspectRatio as string || '1:1';
  const resolution = data.resolution as string || '1K';
  
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateData('imageUrl', url);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageDimensions({
      width: e.currentTarget.naturalWidth,
      height: e.currentTarget.naturalHeight,
    });
  };

  const handleGenerate = () => {
    if (status !== 'processing') {
      const store = useCanvasStore.getState();
      if (store.executeNode) {
        store.executeNode(nodeId);
      }
    }
  };

  return (
    <div className="space-y-2 min-w-[240px]">
      {/* Image Upload/Preview */}
      <div className="px-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id={`image-upload-${nodeId}`}
          onChange={handleImageUpload}
        />
        {imageUrl ? (
          <label
            htmlFor={`image-upload-${nodeId}`}
            className="relative rounded-lg overflow-hidden bg-gray-700 cursor-pointer hover:opacity-90"
            style={{ aspectRatio: imageDimensions ? `${imageDimensions.width}/${imageDimensions.height}` : '16/9' }}
          >
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onLoad={handleImageLoad} />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </label>
        ) : (
          <label
            htmlFor={`image-upload-${nodeId}`}
            className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-600/30"
          >
            <Upload className="w-8 h-8 text-gray-500" />
            <span className="text-xs text-gray-500">点击或拖拽上传</span>
          </label>
        )}
      </div>

      {/* Prompt Input */}
      <div className="px-2">
        <textarea
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none"
          rows={2}
          placeholder="描述你想要生成的画面..."
          value={prompt}
          onChange={(e) => updateData('prompt', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Settings + Generate Button */}
      <div className="px-2 flex gap-2 items-center">
        <select
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          value={aspectRatio}
          onChange={(e) => updateData('aspectRatio', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          {aspectRatioOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          value={resolution}
          onChange={(e) => updateData('resolution', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          {resolutionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 ${
            status === 'processing' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600 text-white'
          }`}
          onClick={handleGenerate}
          disabled={status === 'processing'}
        >
          {status === 'processing' ? (
            <><span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />生成中</>
          ) : (
            <><Sparkles className="w-3 h-3" />生成</>
          )}
        </button>
      </div>

      {/* Status indicator */}
      {status === 'failed' && <div className="px-2 text-[10px] text-red-400">生成失败</div>}
      {status === 'completed' && <div className="px-2 text-[10px] text-green-400">生成完成</div>}
    </div>
  );
}
