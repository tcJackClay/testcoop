import { useState, useCallback } from 'react';
import { GripVertical, Play, Save, Upload, Loader2, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { nodeIcons, nodeColors } from './nodeConstants';
import type { CanvasNode, NodeType } from '../../stores/canvasStore';

interface NodeRendererProps {
  node: CanvasNode;
}

function updateNodeData(id: string, key: string, value: unknown) {
  const node = useCanvasStore.getState().nodes.find(n => n.id === id);
  if (node) {
    useCanvasStore.getState().updateNode(id, {
      data: { ...node.data, [key]: value },
    });
  }
}

export default function NodeRenderer({ node }: NodeRendererProps) {
  const { selectedNodeIds, selectNode, deleteNode } = useCanvasStore();
  const isSelected = selectedNodeIds.includes(node.id);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      selectNode(node.id, true);
    } else {
      selectNode(node.id, false);
    }
  }, [node.id, selectNode]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(node.id);
  }, [node.id, deleteNode]);

  const updateData = (key: string, value: unknown) => updateNodeData(node.id, key, value);

  const renderBody = () => {
    switch (node.type) {
      case 'textNode':
      case 'novelInput':
        return (
          <textarea
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none"
            rows={2}
            placeholder="Enter text..."
            value={(node.data.content as string) || ''}
            onChange={(e) => updateData('content', e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        );
      case 'aiVideo':
      case 'generateCharacterVideo':
      case 'generateSceneVideo':
      case 'aiImage':
      case 'generateCharacterImage':
      case 'generateSceneImage':
        return (
          <input
            type="text"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
            placeholder="Enter prompt..."
            value={(node.data.prompt as string) || ''}
            onChange={(e) => updateData('prompt', e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        );
      case 'characterDescription':
      case 'sceneDescription':
      case 'createCharacter':
      case 'createScene':
        return (
          <div className="text-xs text-gray-400">
            {(node.data.description as string) || 'Click to edit...'}
          </div>
        );
      case 'videoAnalyze':
        return (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Play className="w-3 h-3" />
            <span>Analyze video</span>
          </div>
        );
      case 'storyboardNode':
        return (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ImageIcon className="w-3 h-3" />
            <span>{((node.data.shots as string[]) || []).length || 0} shots</span>
          </div>
        );
      case 'imageCompare':
        return (
          <div className="flex gap-1">
            <div className="w-14 h-12 bg-gray-700 rounded flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="w-14 h-12 bg-gray-700 rounded flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        );
      case 'imageNode':
        return <ImageNodeBody node={node} updateData={updateData} />;
      case 'videoNode':
        return <VideoNodeBody node={node} updateData={updateData} />;
      case 'videoInput':
        return <InputNodeBody type="video" node={node} updateData={updateData} />;
      case 'imageInput':
        return <InputNodeBody type="image" node={node} updateData={updateData} />;
      case 'saveLocal':
        return <SaveNodeBody />;
      case 'preview':
        return <PreviewNodeBody node={node} />;
      default:
        return null;
    }
  };

  const icon = nodeIcons[node.type as NodeType] || <GripVertical className="w-4 h-4" />;
  const colorClass = nodeColors[node.type] || 'border-gray-500 bg-gray-500/10';
  const nodeLabel = node.data.label as string || node.type;

  return (
    <div
      className={`absolute rounded-lg border-2 ${colorClass} ${isSelected ? 'ring-2 ring-blue-500' : ''} shadow-lg min-w-[200px] cursor-move`}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-gray-800/80 rounded-t">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-medium text-white">{nodeLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="p-0.5 hover:bg-gray-700 rounded"
          >
            <Loader2 className="w-3 h-3 text-gray-400" />
          </button>
          <GripVertical className="w-3 h-3 text-gray-500" />
        </div>
      </div>
      {/* Body */}
      <div className="p-2 bg-gray-800/40 rounded-b" onClick={(e) => e.stopPropagation()}>
        {renderBody()}
      </div>
    </div>
  );
}

// Sub-components for complex nodes
function ImageNodeBody({ node, updateData }: { node: CanvasNode; updateData: (k: string, v: unknown) => void }) {
  const [dimensions, setDimensions] = useState<{w: number; h: number} | null>(null);
  const url = node.data.imageUrl as string;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateData('imageUrl', URL.createObjectURL(file));
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setDimensions({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  return (
    <div className="space-y-2 min-w-[240px]">
      <div className="px-2">
        <input type="file" accept="image/*" className="hidden" id={`img-${node.id}`} onChange={handleUpload} />
        {url ? (
          <label htmlFor={`img-${node.id}`} className="relative rounded-lg overflow-hidden bg-gray-700 cursor-pointer hover:opacity-90">
            <img src={url} alt="Preview" className="w-full h-full object-cover" onLoad={handleLoad} style={{ aspectRatio: dimensions ? `${dimensions.w}/${dimensions.h}` : '16/9' }} />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </label>
        ) : (
          <label htmlFor={`img-${node.id}`} className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500">
            <Upload className="w-8 h-8 text-gray-500" />
            <span className="text-xs text-gray-500">点击上传图片</span>
          </label>
        )}
      </div>
    </div>
  );
}

function VideoNodeBody({ node, updateData }: { node: CanvasNode; updateData: (k: string, v: unknown) => void }) {
  const url = node.data.videoUrl as string;
  return (
    <div className="space-y-2 min-w-[240px]">
      <div className="px-2">
        <input type="file" accept="video/*" className="hidden" id={`vid-${node.id}`} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) updateData('videoUrl', URL.createObjectURL(file));
        }} />
        {url ? (
          <label htmlFor={`vid-${node.id}`} className="relative rounded-lg overflow-hidden bg-gray-700 cursor-pointer">
            <video src={url} className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100">
              <Play className="w-8 h-8 text-white" />
            </div>
          </label>
        ) : (
          <label htmlFor={`vid-${node.id}`} className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500">
            <VideoIcon className="w-8 h-8 text-gray-500" />
            <span className="text-xs text-gray-500">点击上传视频</span>
          </label>
        )}
      </div>
    </div>
  );
}

function InputNodeBody({ type, node, updateData }: { type: 'image' | 'video'; node: CanvasNode; updateData: (k: string, v: unknown) => void }) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateData(type === 'image' ? 'imageUrl' : 'videoUrl', url);
    }
  };
  return (
    <div className="flex flex-col items-center py-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500">
      <input type="file" accept={type === 'image' ? 'image/*' : 'video/*'} className="hidden" id={`input-${type}-${node.id}`} onChange={handleUpload} />
      <label htmlFor={`input-${type}-${node.id}`} className="flex flex-col items-center gap-2 cursor-pointer">
        {type === 'image' ? <ImageIcon className="w-8 h-8 text-gray-500" /> : <VideoIcon className="w-8 h-8 text-gray-500" />}
        <span className="text-xs text-gray-500">点击上传{type === 'image' ? '图片' : '视频'}</span>
      </label>
    </div>
  );
}

function SaveNodeBody() {
  return (
    <div className="flex items-center justify-center py-4 text-xs text-gray-500">
      <Save className="w-4 h-4 mr-1" />
      <span>保存到本地</span>
    </div>
  );
}

function PreviewNodeBody({ node }: { node: CanvasNode }) {
  const url = node.data.previewUrl as string;
  return url ? (
    <div className="rounded-lg overflow-hidden bg-gray-700">
      {url.match(/\.(mp4|webm|mov)$/i) ? (
        <video src={url} className="w-full aspect-video" controls />
      ) : (
        <img src={url} alt="Preview" className="w-full" />
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center py-8 text-xs text-gray-500">无预览内容</div>
  );
}
