import { Lock, Unlock, Image, Play, CheckSquare, Square, Layers } from 'lucide-react';
import type { Shot } from '../../types';
import { useStoryboardStore } from '../../stores';

interface StoryboardCardProps {
  shot: Shot;
  isSelected: boolean;
  isInBatchQueue?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onToggleBatch?: () => void;
}

export default function StoryboardCard({ 
  shot, 
  isSelected, 
  isInBatchQueue = false,
  onClick, 
  onDoubleClick,
  onToggleBatch 
}: StoryboardCardProps) {
  const { toggleShotLock, toggleShotOutput } = useStoryboardStore();

  const statusColors = {
    pending: 'bg-gray-700 text-gray-400',
    generating: 'bg-blue-900 text-blue-400',
    completed: 'bg-green-900 text-green-400',
    failed: 'bg-red-900 text-red-400',
  };

  // Calculate aspect ratio for first/last frame display
  const showFirstLastFrame = shot.useFirstLastFrame && (shot.firstFrame || shot.lastFrame);
  const showMultiRef = shot.useMultiRef && shot.referenceImages && shot.referenceImages.length > 0;

  return (
    <div
      className={`bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all relative ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-600'
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Batch Selection Indicator */}
      {onToggleBatch && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleBatch(); }}
          className={`absolute top-2 z-10 p-1 rounded ${
            isInBatchQueue 
              ? 'bg-green-600 text-white' 
              : 'bg-black/50 text-gray-400 hover:text-white'
          }`}
          title={isInBatchQueue ? '从队列移除' : '添加到队列'}
        >
          {isInBatchQueue ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
      )}

      {/* Image Display Area */}
      <div className="aspect-video bg-gray-700 relative">
        {/* First/Last Frame Mode */}
        {showFirstLastFrame && (
          <div className="w-full h-full flex">
            {shot.firstFrame && (
              <div className="flex-1 relative">
                <img src={shot.firstFrame} alt="First Frame" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 px-1 rounded">首帧</span>
              </div>
            )}
            {shot.lastFrame && (
              <div className="flex-1 relative border-l border-gray-600">
                <img src={shot.lastFrame} alt="Last Frame" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 px-1 rounded">尾帧</span>
              </div>
            )}
          </div>
        )}

        {/* Multi-Reference Mode */}
        {showMultiRef && !showFirstLastFrame && (
          <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-0.5">
            {shot.referenceImages?.slice(0, 5).map((img, idx) => (
              <div 
                key={idx} 
                className={`relative ${idx === 0 ? 'row-span-2' : ''}`}
              >
                <img src={img} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 left-0 text-[8px] bg-black/60 px-0.5 rounded">
                  Ref{idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Single Image Mode */}
        {!showFirstLastFrame && !showMultiRef && (
          <>
            {shot.imageUrl ? (
              <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <Image className="w-8 h-8 opacity-50" />
              </div>
            )}
          </>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-8">
          <span className={`px-2 py-0.5 rounded text-xs ${statusColors[shot.status]}`}>
            {shot.status}
          </span>
        </div>

        {/* Shot Number */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 bg-black/60 rounded text-xs">
            {shot.sceneNumber}-{shot.shotNumber}
          </span>
        </div>

        {/* Locked Indicator */}
        {shot.locked && (
          <div className="absolute bottom-2 right-2">
            <Lock className="w-4 h-4 text-yellow-500" />
          </div>
        )}

        {/* Multi-Reference Badge */}
        {showMultiRef && (
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-600/80 rounded text-[10px]">
              <Layers size={10} />
              {shot.referenceImages?.length}
            </div>
          </div>
        )}

        {/* Output Disabled Indicator */}
        {!shot.outputEnabled && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-xs text-gray-400">已禁用输出</span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="p-3">
        <p className="text-sm text-gray-300 truncate">{shot.description || 'No description'}</p>
        
        {/* Quick Info */}
        {(shot.shotType || shot.cameraMovement) && (
          <p className="text-[10px] text-gray-500 mt-1 truncate">
            {[shot.shotType, shot.cameraMovement].filter(Boolean).join(' • ')}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
          <button
            onClick={(e) => { e.stopPropagation(); toggleShotLock(shot.id); }}
            className={`p-1 rounded ${shot.locked ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-400'}`}
            title={shot.locked ? '解锁' : '锁定'}
          >
            {shot.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); toggleShotOutput(shot.id); }}
            className={`p-1 rounded ${shot.outputEnabled ? 'text-green-500' : 'text-gray-600'}`}
            title={shot.outputEnabled ? '禁用输出' : '启用输出'}
          >
            <Play className={`w-4 h-4 ${shot.outputEnabled ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
