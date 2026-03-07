// AssetSidebar Component - 资产库侧边栏
import { useState, useMemo } from 'react';
import { X, Image, Film, Search } from 'lucide-react';

interface AssetItem {
  id: string;
  name: string;
  type?: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface AssetSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetSelect?: (asset: AssetItem) => void;
}

// 默认分类
const DEFAULT_CATEGORIES = ['角色', '场景', '道具'];

export default function AssetSidebar({ isOpen, onClose, onAssetSelect }: AssetSidebarProps) {
  const [activeCategory, setActiveCategory] = useState('角色');
  const [searchValue, setSearchValue] = useState('');
  
  // 模拟资产数据
  const [assets] = useState<AssetItem[]>([
    { id: '1', name: '角色1', type: 'character', imageUrl: '' },
    { id: '2', name: '场景1', type: 'scene', imageUrl: '' },
    { id: '3', name: '道具1', type: 'prop', imageUrl: '' },
  ]);

  // 过滤资产
  const filteredAssets = useMemo(() => {
    let filtered = assets.filter(asset => {
      if (activeCategory === '角色') return asset.type === 'character';
      if (activeCategory === '场景') return asset.type === 'scene';
      if (activeCategory === '道具') return asset.type === 'prop';
      return true;
    });
    
    if (searchValue) {
      const query = searchValue.toLowerCase();
      filtered = filtered.filter(asset => asset.name.toLowerCase().includes(query));
    }
    
    return filtered;
  }, [assets, activeCategory, searchValue]);

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-16 bottom-4 w-80 bg-gray-800 border-l border-gray-700 rounded-l-lg flex flex-col z-40 animate-in slide-in-from-right duration-300 shadow-xl">
      {/* Header */}
      <div className="h-14 px-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Image className="w-5 h-5 text-blue-400" />
          资产库
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="搜索资产..."
            className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex border-b border-gray-700">
        {DEFAULT_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeCategory === category
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {filteredAssets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => onAssetSelect?.(asset)}
              className="aspect-video bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group"
            >
              {asset.imageUrl ? (
                <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  {asset.type === 'character' ? <Image className="w-8 h-8" /> : 
                   asset.type === 'scene' ? <Image className="w-8 h-8" /> : 
                   <Image className="w-8 h-8" />}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white truncate">
                {asset.name}
              </div>
            </button>
          ))}
        </div>
        
        {filteredAssets.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无资产</p>
          </div>
        )}
      </div>
    </aside>
  );
}
