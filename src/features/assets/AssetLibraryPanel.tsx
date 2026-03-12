import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Filter,
  Image as ImageIcon,
  Folder,
  Star,
  User,
  Mountain,
  MapPin,
  Gem,
  Package,
  Loader2,
} from 'lucide-react';
import { useAssetStore } from '../../stores/assetStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { Image as AssetImageType } from '../../api/image';
import AssetCard from './AssetCard';
import AssetSidebar from './AssetSidebar';
import VariantDetailView from './VariantDetailView';
import ContextMenu from './ContextMenu';
import { mapCategoryToType, type AssetLibraryPanelProps, type AssetStats, type AssetCategory } from './AssetLibraryPanel.types';
import { imageApi } from '../../api/image';

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
    selectAsset,
    syncVariants,
  } = useAssetStore();
  
  const { addNode, nodes } = useCanvasStore();
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    asset: Image;
    position: { x: number; y: number };
    currentCategory?: string;
    canvasCenterPosition?: { x: number; y: number };
  } | null>(null);
  
  // Delete loading state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Variant detail view state
  const [selectedPrimaryAsset, setSelectedPrimaryAsset] = useState<Image | null>(null);
  
  // Helper functions
  const isSecondaryAsset = (asset: Image): boolean => {
    return !!asset.parentId && asset.parentId.length > 0;
  };
  
  const isPrimaryAsset = (asset: Image): boolean => {
    return !isSecondaryAsset(asset);
  };
  
  const getVariantsForPrimary = (primaryAsset: Image): Image[] => {
    const primaryName = primaryAsset.name || primaryAsset.resourceName;
    return assets.filter((asset) => asset.parentId === primaryName);
  };
  
  // 获取资产分类（与 assetStore 保持一致）
  const getAssetCategory = (asset: Image): string => {
    const resourceName = asset.resourceName || asset.name || '';
    
    // 检查名称是否包含 " - " （变体命名模式）
    if (resourceName.includes(' - ')) {
      const parentName = resourceName.split(' - ')[0].trim();
      if (parentName.includes('角色')) return '次要角色';
      if (parentName.includes('场景')) return '次要场景';
      if (parentName.includes('道具')) return '次要道具';
      // 查找父资产
      const parentAsset = assets.find((a) => 
        a.name === parentName || a.resourceName === parentName
      );
      if (parentAsset) {
        const parentCategory = mapCategoryToType(parentAsset.resourceType);
        return parentCategory.replace('主要', '次要');
      }
    }
    
    // 检查 ext1
    if (asset.ext1) {
      try {
        const ext1Data = JSON.parse(asset.ext1);
        if (ext1Data.parent) {
          const parentName = ext1Data.parent;
          if (parentName.includes('角色')) return '次要角色';
          if (parentName.includes('场景')) return '次要场景';
          if (parentName.includes('道具')) return '次要道具';
        }
        if (ext1Data.type) {
          return mapCategoryToType(ext1Data.type);
        }
      } catch (e) {
        return mapCategoryToType(asset.ext1);
      }
    }
    
    // 使用 resourceType
    if (asset.resourceType && asset.resourceType !== 'image') {
      return mapCategoryToType(asset.resourceType);
    }
    
    return '次要道具';
  };
  
  // Handle right-click on asset
  const handleContextMenu = (asset: Image, e: React.MouseEvent) => {
    e.preventDefault();
    const category = getAssetCategory(asset);
    setContextMenu({
      asset,
      position: { x: e.clientX, y: e.clientY },
      currentCategory: category,
      canvasCenterPosition: getCanvasCenterPosition(),
    });
  };
  
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
  // Delete asset
  const handleDeleteAsset = async (asset: Image) => {
    if (!asset.id) return;
    
    setDeletingId(asset.id);
    try {
      await imageApi.delete(asset.id);
      useAssetStore.getState().fetchAssets();
      console.log('Asset deleted:', asset.name);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingId(null);
    }
  };
  
  // Component mount: fetch assets and sync variants only once
  const hasSyncedRef = useRef(false);
  
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    
    // 先同步变体，再获取最新资产列表
    syncVariants().then(() => {
      fetchAssets();
    });
  }, []);
  
  // Calculate canvas center position
  const getCanvasCenterPosition = () => {
    if (nodes.length === 0) {
      return { x: 100, y: 100 };
    }
    const maxX = Math.max(...nodes.map(n => n.position.x + (n.width || 200)));
    const maxY = Math.max(...nodes.map(n => n.position.y + (n.height || 100)));
    return { x: maxX + 50, y: maxY };
  };
  
  // Add new asset node to canvas
  const handleAddAssetNode = () => {
    const position = getCanvasCenterPosition();
    addNode('createAsset', position);
    console.log('Added createAsset node to canvas at position:', position);
  };
  
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
  
  // Filter to show only primary assets
  const filteredAssets = getFilteredAssets().filter((asset) => isPrimaryAsset(asset));
  const totalAssets = filteredAssets.length;
  
  const getCount = (key: string): number => {
    if (key === 'all') return totalAssets;
    return stats[key as AssetCategory] || 0;
  };
  
  // Handle asset card click
  const handleAssetClick = (asset: Image) => {
    selectAsset(asset.id!);
    if (getVariantsForPrimary(asset).length > 0) {
      setSelectedPrimaryAsset(asset);
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Main Content */}
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
          {/* Error state */}
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
          
          {/* Empty state */}
          {!error && totalAssets === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">暂无资产</p>
              <p className="text-[10px] mt-1">点击下方按钮添加资产</p>
            </div>
          )}
          
          {/* Asset grid */}
          {!error && totalAssets > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {/* Add New Card */}
              <div 
                onClick={handleAddAssetNode}
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
              
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset as any}
                  onDragStart={(asset) => console.log('Drag start:', asset.name)}
                  onDragEnd={() => {}}
                  onContextMenu={(assetParam, e) => handleContextMenu(assetParam, e)}
                  onClick={() => handleAssetClick(asset)}
                />
              ))}
            </div>
          )}
          
          {/* Variant Detail View */}
          {selectedPrimaryAsset && (
            <VariantDetailView
              selectedPrimaryAsset={selectedPrimaryAsset}
              variants={getVariantsForPrimary(selectedPrimaryAsset)}
              onBack={() => setSelectedPrimaryAsset(null)}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <AssetSidebar
        categories={categories}
        filterType={filterType}
        setFilterType={setFilterType}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          asset={contextMenu.asset}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          onDelete={handleDeleteAsset}
          currentCategory={contextMenu.currentCategory}
          canvasCenterPosition={contextMenu.canvasCenterPosition}
        />
      )}
    </div>
  );
}
