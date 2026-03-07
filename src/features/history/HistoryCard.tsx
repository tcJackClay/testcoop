import { Image as ImageIcon, Video, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import type { HistoryItem } from '../../types';

interface HistoryCardProps {
  item: HistoryItem;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export default function HistoryCard({ item, isSelected, onClick, onDelete }: HistoryCardProps) {
  const statusConfig = {
    pending: { icon: RefreshCw, className: 'text-yellow-500 animate-spin', label: 'Pending' },
    success: { icon: CheckCircle, className: 'text-green-500', label: 'Success' },
    failed: { icon: AlertCircle, className: 'text-red-500', label: 'Failed' },
  };

  const status = statusConfig[item.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={`bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-600'
      }`}
      onClick={onClick}
    >
      <div className="aspect-square bg-gray-700 relative">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            {item.type === 'image' ? <ImageIcon className="w-8 h-8" /> : <Video className="w-8 h-8" />}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`p-1 rounded-full bg-black/60 ${status.className}`}>
            <StatusIcon className="w-3 h-3" />
          </span>
        </div>
      </div>
      <div className="p-2">
        <p className="text-xs text-gray-400 truncate">{item.prompt || 'No prompt'}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">{item.modelName}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-gray-500 hover:text-red-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
