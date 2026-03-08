// PromptNode - AI绘图提示词节点组件
import { useState, useCallback } from 'react';
import { Sparkles, Settings, X } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { aspectRatioOptions, resolutionOptions } from './nodeConstants';

interface PromptNodeProps {
  nodeId: string;
  data: {
    promptText?: string;
    aspectRatio?: string;
    resolution?: string;
    status?: string;
    generatedImageUrl?: string;
  };
  updateData: (key: string, value: unknown) => void;
}

export default function PromptNode({ nodeId, data, updateData }: PromptNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [promptText, setPromptText] = useState(data.promptText || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(data.aspectRatio || '1:1');
  const [resolution, setResolution] = useState(data.resolution || '1K');

  const status = data.status as string || 'idle';
  const generatedImageUrl = data.generatedImageUrl as string || '';

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    updateData('promptText', promptText);
  }, [promptText, updateData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setShowSettings(false);
      setPromptText(data.promptText || '');
    }
    e.stopPropagation();
  }, [data.promptText]);

  // 处理生成图片
  const handleGenerate = async () => {
    if (!promptText.trim() || isGenerating) return;
    
    setIsGenerating(true);
    try {
      // 调用 canvas store 的执行方法
      const store = useCanvasStore.getState();
      if (store.executeNode) {
        await store.executeNode(nodeId, {
          promptText,
          aspectRatio,
          resolution,
        });
      }
    } catch (error) {
      console.error('生成图片失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = () => {
    const store = useCanvasStore.getState();
    if (store.deleteNode) {
      store.deleteNode(nodeId);
    }
  };

  return (
    <div className="min-w-[280px] max-w-[360px] bg-gray-800 rounded-xl shadow-lg border border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-pink-400" />
        </div>
        <div className="flex-1">
          <span className="text-xs font-medium text-white uppercase tracking-wider">提示词</span>
          <p className="text-[10px] text-gray-400">输入生成描述</p>
        </div>
        
        {/* 关闭按钮 */}
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
          title="删除节点"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div
          onClick={() => setIsEditing(true)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="描述你想要生成的画面..."
              className="w-full min-h-[80px] px-3 py-2 text-sm bg-gray-700 border border-pink-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-white"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="w-full min-h-[60px] bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 cursor-text hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-600 hover:border-pink-500/30">
              {promptText || <span className="text-gray-500 italic">点击输入提示词...</span>}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 pb-3 space-y-2">
        {/* Settings Panel */}
        {showSettings && (
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="space-y-3">
              {/* 画面比例 */}
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1.5 block">画面比例</label>
                <div className="grid grid-cols-5 gap-1">
                  {aspectRatioOptions.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => {
                        setAspectRatio(ratio.value);
                        updateData('aspectRatio', ratio.value);
                      }}
                      className={`text-[10px] py-1.5 rounded-md font-medium transition-colors ${
                        aspectRatio === ratio.value
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 分辨率 */}
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1.5 block">分辨率</label>
                <div className="grid grid-cols-3 gap-2">
                  {resolutionOptions.map((res) => (
                    <button
                      key={res.value}
                      onClick={() => {
                        setResolution(res.value);
                        updateData('resolution', res.value);
                      }}
                      className={`text-[10px] py-1.5 rounded-md font-medium transition-colors ${
                        resolution === res.value
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 当前设置预览 */}
              <div className="text-[9px] text-gray-500 pt-1">
                当前: {aspectRatio} · {resolution}
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-2 text-xs font-medium flex items-center gap-1 rounded-lg transition-colors ${
              showSettings 
                ? 'bg-pink-500/20 text-pink-400' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="生成设置"
          >
            <Settings size={14} />
            设置
          </button>
          
          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!promptText.trim() || isGenerating}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-2 rounded-lg transition-colors ${
              !promptText.trim() || isGenerating
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                生成图片
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
