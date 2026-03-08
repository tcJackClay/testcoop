// VideoNode - AI视频节点组件
import { Film } from 'lucide-react';

interface VideoNodeProps {
  nodeId: string;
  data: {
    videoUrl?: string;
    prompt?: string;
    status?: string;
  };
  updateData: (key: string, value: unknown) => void;
}

export default function VideoNode({ nodeId, data, updateData }: VideoNodeProps) {
  const videoUrl = data.videoUrl as string || '';
  const prompt = data.prompt as string || '';
  const status = data.status as string || 'idle';

  return (
    <div className="space-y-2">
      {/* Video Preview / Upload Area */}
      <div
        className="w-32 h-20 bg-gray-700 rounded flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-600"
        onClick={(e) => e.stopPropagation()}
        title="Click to upload video"
      >
        {videoUrl ? (
          <video src={videoUrl} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <Film className="w-6 h-6 text-gray-500 mx-auto" />
            <span className="text-[10px] text-gray-500">Upload</span>
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <input
        type="text"
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
        placeholder="Enter prompt..."
        value={prompt}
        onChange={(e) => updateData('prompt', e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Status indicator */}
      {status === 'processing' && (
        <div className="text-[10px] text-yellow-400">Generating...</div>
      )}
    </div>
  );
}
