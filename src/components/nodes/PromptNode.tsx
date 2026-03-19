// PromptNode - AI绘图提示词节点组件
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { aspectRatioOptions, resolutionOptions } from './nodeConstants';
import { useCanvasStore } from '../../stores/canvasStore';
import { generateImage } from '../../api/promptGen';

interface PromptNodeProps {
  nodeId: string;
  data: {
    promptText?: string;
    aspectRatio?: string;
    resolution?: string;
    status?: string;
  };
  updateData: (key: string, value: unknown) => void;
}

export default function PromptNode({ nodeId, data, updateData }: PromptNodeProps) {
  const prompt = data.promptText as string || '';
  const status = data.status as string || 'idle';
  const aspectRatio = data.aspectRatio as string || '1:1';
  const resolution = data.resolution as string || '1K';

  const handleGenerate = async () => {
    if (!prompt.trim() || status === 'processing') return;
    
    updateData('status', 'processing');
    
    try {
      const result = await generateImage(prompt, {
        aspectRatio,
        resolution,
      });
      
      console.log('[PromptNode] 生成成功:', result);
      
      // 创建 ImageNode
      const { nodes, addNode, addConnection } = useCanvasStore.getState();
      const promptNode = nodes.find(n => n.id === nodeId);
      
      if (promptNode) {
        // 计算新节点位置（在当前节点右侧 350px）
        const newNodeX = promptNode.position.x + 350;
        const newNodeY = promptNode.position.y;
        
        // 创建 ImageNode
        const imageNodeId = `image-${Date.now()}`;
        addNode('imageNode', { x: newNodeX, y: newNodeY }, {
          data: {
            imageUrl: result.imageUrl,
            assetId: result.imageId,
            label: '生成结果',
            processInfo: '生成',
            ext2: JSON.stringify([{
              type: '生成',
              prompt: prompt,
              timestamp: Date.now()
            }])
          }
        });
        
        // 创建连线
        addConnection(nodeId, imageNodeId, 'default');
        
        updateData('status', 'completed');
      }
    } catch (error) {
      console.error('[PromptNode] 生成失败:', error);
      updateData('status', 'failed');
    }
  };

  return (
    <div className="space-y-2 min-w-[240px]">
      {/* Prompt Input */}
      <div className="px-2">
        <textarea
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none"
          rows={3}
          placeholder="描述你想要生成的画面..."
          value={prompt}
          onChange={(e) => updateData('promptText', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Settings + Generate Button */}
      <div className="px-2 flex gap-2 items-center">
        <select
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          value={aspectRatio}
          onChange={(e) => {
            e.preventDefault();
            updateData('aspectRatio', e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {aspectRatioOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          value={resolution}
          onChange={(e) => {
            e.preventDefault();
            updateData('resolution', e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {resolutionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          type="button"
          className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 ${
            status === 'processing' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600 text-white'
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleGenerate();
          }}
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
