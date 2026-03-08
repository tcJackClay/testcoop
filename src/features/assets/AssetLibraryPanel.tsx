import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Filter,
  Image as ImageIcon,
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
  HardDrive,
  Loader2
} from 'lucide-react';
import type { Image } from '../../api/image';
import { useAssetStore } from '../../stores/assetStore';
import AssetCard from './AssetCard';

interface AssetLibraryPanelProps {
  onClose: () => void;
}

interface AssetStats {
  主要角色: number;
  次要角色: number;
  主要场景: number;
  次要场景: number;
  主要道具: number;
  次要道具: number;
}

type AssetCategory = '主要角色' | '次要角色' | '主要场景' | '次要场景' | '主要道具' | '次要道具';

const categories = [
  { key: 'all', label: '所有资产', icon: <Folder size={12} />, color: 'text-gray-400' },
  { key: '主要角色', label: '主要角色', icon: <Star size={12} />, color: 'text-blue-400' },
  { key: '次要角色', label: '次要角色', icon: <User size={12} />, color: 'text-blue-400' },
  { key: '主要场景', label: '主要场景', icon: <Mountain size={12} />, color: 'text-green-400' },
  { key: '次要场景', label: '次要场景', icon: <MapPin size={12} />, color: 'text-green-400' },
  { key: '主要道具', label: '主要道具', icon: <Gem size={12} />, color: 'text-orange-400' },
  { key: '次要道具', label: '次要道具', icon: <Package size={12} />, color: 'text-orange-400' },
];

// 映射后端 category 到前端类型
const mapCategoryToType = (category?: string): string => {
  if (!category) return '次要道具';
  if (category.includes('主要') && category.includes('角色')) return '主要角色';
  if (category.includes('次要') && category.includes('角色')) return '次要角色';
  if (category.includes('主要') && category.includes('场景')) return '主要场景';
  if (category.includes('次要') && category.includes('场景')) return '次要场景';
  if (category.includes('主要') && category.includes('道具')) return '主要道具';
  if (category.includes('次要') && category.includes('道具')) return '次要道具';
  return '次要道具';
};

export default function AssetLibraryPanel({ onClose }: AssetLibraryPanelProps) {
  const {
    assets,
    isLoading,
    error,
    filterType,
    searchTerm,
    fetchAssets,
    setFilterType,
    setSearchTerm,
    getFilteredAssets,
  } = useAssetStore();
  
  const [viewMode] = useState<'grid' | 'list'>('grid');

  // 组件挂载时获取资产数据
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

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
      const type = mapCategoryToType(asset.name);
      if (result[type as AssetCategory] !== undefined) {
        result[type as AssetCategory]++;
      }
    });
    
    return result;
  }, [assets]);

  const filteredAssets = getFilteredAssets();
  const totalAssets = filteredAssets.length;

  const getCount = (key: string): number => {
    if (key === 'all') return totalAssets;
    return stats[key as AssetCategory] || 0;
  };

  const handleDragStart = (asset: Image) => {
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
            <span className="text-[10px] text-gray-500">({totalAssets})</span>
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
          
          {/* Loading indicator */}
          {isLoading && (
            <Loader2 size={14} className="text-blue-400 animate-spin" />
          )}
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {error && (
            <div className="text-center text-red-400 py-4">
              <p className="text-xs">{error}</p>
              <button 
                onClick={() => fetchAssets()}
                className="mt-2 text-[10px] text-blue-400 hover:text-blue-300"
              >
                点击重试
              </button>
            </div>
          )}
          
          {!error && totalAssets === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">暂无资产</p>
              <p className="text-[10px] mt-1">点击下方按钮添加资产</p>
            </div>
          )}
          
          {!error && totalAssets > 0 && (
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
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset as any}
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
            <ImageIcon size={12} />
            <span>导入</span>
          </button>
        </div>
      </div>

      {/* Sidebar - Right with vertical text */}
      <div className="w-12 border-l border-gray-700 bg-gray-800 flex flex-col items-center py-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilterType(cat.key as any)}
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
