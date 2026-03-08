import { 
  Folder, 
  Star, 
  User, 
  Mountain, 
  MapPin, 
  Gem, 
  Package,
  HardDrive 
} from 'lucide-react';
import type { AssetStats, AssetCategory } from '../../types/asset';

interface AssetSidebarProps {
  filterType: string;
  setFilterType: (type: string) => void;
  stats: AssetStats;
  totalAssets: number;
  storageUsed?: number;
  storageTotal?: number;
}

const categories = [
  { key: 'all', label: '所有资产', icon: <Folder size={14} />, color: 'text-gray-400' },
  { key: '主要角色', label: '主要角色', icon: <Star size={14} />, color: 'text-blue-400' },
  { key: '次要角色', label: '次要角色', icon: <User size={14} />, color: 'text-blue-400' },
  { key: '主要场景', label: '主要场景', icon: <Mountain size={14} />, color: 'text-green-400' },
  { key: '次要场景', label: '次要场景', icon: <MapPin size={14} />, color: 'text-green-400' },
  { key: '主要道具', label: '主要道具', icon: <Gem size={14} />, color: 'text-orange-400' },
  { key: '次要道具', label: '次要道具', icon: <Package size={14} />, color: 'text-orange-400' },
];

export default function AssetSidebar({ 
  filterType, 
  setFilterType, 
  stats, 
  totalAssets,
  storageUsed = 0,
  storageTotal = 20 
}: AssetSidebarProps) {
  const storagePercent = storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0;

  const getCount = (key: string): number => {
    if (key === 'all') return totalAssets;
    return stats[key as AssetCategory] || 0;
  };

  return (
    <aside className="w-full h-full flex flex-col border-r border-gray-700 bg-gray-800">
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilterType(cat.key)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
              filterType === cat.key 
                ? 'bg-blue-500/20 text-blue-300' 
                : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            <span className={cat.color}>{cat.icon}</span>
            <span className="text-[11px] flex-1">{cat.label}</span>
            <span className="text-[10px] text-gray-500">{getCount(cat.key)}</span>
          </button>
        ))}
      </div>

      {/* Storage */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive size={12} className="text-gray-500" />
          <span className="text-[10px] text-gray-500">存储容量</span>
        </div>
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: `${Math.min(storagePercent, 100)}%` }}
          />
        </div>
        <p className="text-[9px] text-gray-500 mt-1">
          {(storageUsed).toFixed(1)} GB / {storageTotal} GB
        </p>
      </div>
    </aside>
  );
}
