import { HardDrive } from 'lucide-react';
import type { AssetCategory } from './AssetLibraryPanel.types';

interface Category {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface AssetSidebarProps {
  categories: Category[];
  filterType: AssetCategory | 'all';
  setFilterType: (type: AssetCategory | 'all') => void;
}

export default function AssetSidebar({ categories, filterType, setFilterType }: AssetSidebarProps) {
  return (
    <div className="w-12 border-l border-gray-700 bg-gray-800 flex flex-col items-center py-2">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => setFilterType(cat.key as AssetCategory | 'all')}
          className={`w-full py-2 flex flex-col items-center gap-1 transition-colors ${
            filterType === cat.key 
              ? 'bg-blue-500/20' 
              : 'hover:bg-gray-700'
          }`}
          title={cat.label}
        >
          <span className={filterType === cat.key ? 'text-blue-300' : cat.color}>
            {cat.icon}
          </span>
          <span className={`text-[8px] writing-vertical ${filterType === cat.key ? 'text-blue-300' : 'text-gray-500'}`}>
            {cat.label}
          </span>
        </button>
      ))}

      {/* Storage */}
      <div className="mt-auto pt-2 border-t border-gray-700 w-full px-1">
        <div className="flex flex-col items-center gap-1">
          <HardDrive size={12} className="text-gray-500" />
          <span className="text-[8px] text-gray-500 writing-vertical">容量</span>
        </div>
      </div>
    </div>
  );
}
