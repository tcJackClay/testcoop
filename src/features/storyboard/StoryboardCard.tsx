import { Lock, Unlock, Image, Play } from 'lucide-react';
import type { Shot } from '../../types';
import { useStoryboardStore } from '../../stores/storyboardStore';

interface StoryboardCardProps {
  shot: Shot;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

export default function StoryboardCard({ 
  shot, 
  isSelected, 
  onClick, 
  onDoubleClick 
}: StoryboardCardProps) {
  const { toggleShotLock, toggleShotOutput } = useStoryboardStore();

  const statusColors = {
    pending: 'bg-gray-700 text-gray-400',
    generating: 'bg-blue-900 text-blue-400',
    completed: 'bg-green-900 text-green-400',
    failed: 'bg-red-900 text-red-400',
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-600'
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="aspect-video bg-gray-700 relative">
        {shot.imageUrl ? (
          <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <Image className="w-8 h-8 opacity-50" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded text-xs ${statusColors[shot.status]}`}>
            {shot.status}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 bg-black/60 rounded text-xs">
            {shot.sceneNumber}-{shot.shotNumber}
          </span>
        </div>
        {shot.locked && (
          <div className="absolute bottom-2 right-2">
            <Lock className="w-4 h-4 text-yellow-500" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm text-gray-300 truncate">{shot.description || 'No description'}</p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
          <button
            onClick={(e) => { e.stopPropagation(); toggleShotLock(shot.id); }}
            className={`p-1 rounded ${shot.locked ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-400'}`}
          >
            {shot.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleShotOutput(shot.id); }}
            className={`p-1 rounded ${shot.outputEnabled ? 'text-green-500' : 'text-gray-600'}`}
          >
            <Play className={`w-4 h-4 ${shot.outputEnabled ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
