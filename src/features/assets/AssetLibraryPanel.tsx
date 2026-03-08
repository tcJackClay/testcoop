import { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Filter,
  Image,
  Grid,
  List,
  Upload,
  Folder,
  Star,
  User,
  Mountain,
  MapPin,
  Gem,
  Package,
  HardDrive
} from 'lucide-react';
import type { AssetWithVariants, AssetStats, AssetCategory } from '../../types/asset';
import AssetCard from './AssetCard';

interface AssetLibraryPanelProps {
  onClose: () => void;
}

// Mock data
const MOCK_ASSETS: AssetWithVariants[] = [
  {
    id: '1',
    name: '主角-少年',
    description: '热血少年主角',
    category: '主要角色',
    imageUrl: '',
    variants: ['少年', '成年', '老年'],
  },
  {
    id: '2',
    name: '女主-公主',
    description: '王国公主',
    category: '主要角色',
    imageUrl: '',
  },
  {
    id: '3',
    name: '反派-国王',
    description: '黑化国王',
    category: '次要角色',
    imageUrl: '',
  },
  {
    id: '4',
    name: '城堡',
    description: '王城场景',
    category: '主要场景',
    imageUrl: '',
  },
  {
    id: '5',
    name: '森林',
    description: '魔法森林',
    category: '次要场景',
    imageUrl: '',
  },
  {
    id: '6',
    name: '圣剑',
    description: '神器武器',
    category: '主要道具',
    imageUrl: '',
  },
];

const categories = [
  { key: 'all', label: '所有资产', icon: <Folder size={12} />, color: 'text-gray-400' },
  { key: '主要角色', label: '主要角色', icon: <Star size={12} />, color: 'text-blue-400' },
  { key: '次要角色', label: '次要角色', icon: <User size={12} />, color: 'text-blue-400' },
  { key: '主要场景', label: '主要场景', icon: <Mountain size={12} />, color: 'text-green-400' },
  { key: '次要场景', label: '次要场景', icon: <MapPin size={12} />, color: 'text-green-400' },
  { key: '主要道具', label: '主要道具', icon: <Gem size={12} />, color: 'text-orange-400' },
  { key: '次要道具', label: '次要道具', icon: <Package size={12} />, color: 'text-orange-400' },
];

export default function AssetLibraryPanel({ onClose }: AssetLibraryPanelProps) {
  const [assets] = useState<AssetWithVariants[]>(MOCK_ASSETS);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode] = useState<'grid' | 'list'>('grid');

  // Calculate stats
  const stats: AssetStats = useMemo(() => {
    const result: AssetStats = {
      主要角色: 0,
      次要角色: 0,
      主要场景: 0,
      次要场景: 0,
      主要道具: 0,
      次要道具: 0,
    };
    assets.forEach(asset => {
      if (result[asset.category] !== undefined) {
        result[asset.category]++;
      }
    });
    return result;
  }, [assets]);

  const totalAssets = assets.length;

  const getCount = (key: string): number => {
    if (key === 'all') return totalAssets;
    return stats[key as AssetCategory] || 0;
  };

  // Filter assets
  const filteredAssets = useMemo(() => {
    let result = assets;

    // Filter by category
    if (filterType !== 'all') {
      result = result.filter(a => a.category === filterType);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [assets, filterType, searchTerm]);

  const handleDragStart = (asset: AssetWithVariants) => {
    console.log('Drag start:', asset.name);
  };

  return (
    <div className="flex h-full">
      {/* Main Content - Left */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-10 border-b border-gray-700 flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">资产库</span>
            <span className="text-[10px] text-gray-500">({filteredAssets.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-white rounded"
          >
            <X size={14} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索..."
                className="w-24 bg-gray-700 border border-gray-600 rounded pl-7 pr-2 py-1 text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter */}
            <button className="p-1.5 text-gray-400 hover:text-white rounded bg-gray-700">
              <Filter size={12} />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredAssets.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Image size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">暂无资产</p>
              <p className="text-[10px] mt-1">点击下方按钮添加资产</p>
            </div>
          ) : (
            <div className={`grid gap-3 ${
              viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
              {/* Add New Card */}
              <div 
                onClick={() => console.log('Add new asset')}
                className="flex flex-col aspect-square rounded-lg border-2 border-dashed border-gray-600 cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 transition-colors"
              >
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <Plus size={20} className="text-gray-500" />
                  </div>
                </div>
                <div className="pb-3 text-center">
                  <span className="text-[10px] text-gray-500">新建资产</span>
                </div>
              </div>

              {/* Asset Cards */}
              <div 
                onClick={() => console.log('Add new asset')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-600 cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <Plus size={16} className="text-gray-500" />
                </div>
                <span className="text-[10px] text-gray-500">新建资产</span>
              </div>

              {/* Asset Cards */}
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDragStart={handleDragStart}
                  onDragEnd={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-gray-700 flex gap-2 shrink-0">
          <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-[10px] transition-colors">
            <Upload size={12} />
            <span>上传资产</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-[10px] transition-colors">
            <Image size={12} />
            <span>导入</span>
          </button>
        </div>
      </div>

      {/* Sidebar - Right with vertical text */}
      <div className="w-12 border-l border-gray-700 bg-gray-800 flex flex-col items-center py-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilterType(cat.key)}
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
              {cat.label.replace('主要', '').replace('次要', '')}
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
    </div>
  );
}
