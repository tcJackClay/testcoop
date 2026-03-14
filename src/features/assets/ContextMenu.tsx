import { useState, useEffect, useRef } from 'react';
import { Trash2, Download, Eye, ChevronRight, Tag, Plus } from 'lucide-react';
import type { Image as AssetImage } from '../../api/image';
import { useAssetStore } from '@/stores';
import { useCanvasStore } from '@/stores/canvasStore';

interface ContextMenuProps {
  asset: AssetImage;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: (asset: AssetImage) => void;
  onViewDetails?: (asset: AssetImage) => void;
  currentCategory?: string;
  canvasCenterPosition?: { x: number; y: number };
}

const CATEGORIES = [
  { key: '主要角色', label: '主要角色', color: 'text-blue-400' },
  { key: '次要角色', label: '次要角色', color: 'text-blue-300' },
  { key: '主要场景', label: '主要场景', color: 'text-green-400' },
  { key: '次要场景', label: '次要场景', color: 'text-green-300' },
  { key: '主要道具', label: '主要道具', color: 'text-yellow-400' },
  { key: '次要道具', label: '次要道具', color: 'text-yellow-300' },
];

export default function ContextMenu({ 
  asset, 
  position, 
  onClose, 
  onDelete,
  onViewDetails,
  currentCategory: initialCategory,
  canvasCenterPosition
}: ContextMenuProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const { updateAssetCategory } = useAssetStore();
  const { addNode, nodes } = useCanvasStore();
  
  // 获取当前资产分类（优先使用传入的值）
  const [currentCategory, setCurrentCategory] = useState<string>(initialCategory || '次要道具');
  
  // 当 prop 变化时更新
  useEffect(() => {
    if (initialCategory) {
      setCurrentCategory(initialCategory);
    }
  }, [initialCategory]);

  // Handle click outside to close menu
  const handleOverlayClick = () => {
    onClose();
  };

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(asset);
    setShowConfirm(false);
    onClose();
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(asset);
    }
    onClose();
  };

  const handleDownload = () => {
    const imageUrl = asset.url || asset.resourceContent;
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = asset.name || asset.resourceName || 'asset';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    onClose();
  };

  // 添加资产到画布 - 创建 ImageNode 显示预览图
  const handleAddToCanvas = () => {
    const position = canvasCenterPosition || { x: 100, y: 100 };
    const imageUrl = asset.url || asset.resourceContent || '';
    const assetName = asset.name || asset.resourceName || '';
    
    // 创建 ImageNode 显示预览图
    addNode('imageNode', position, {
      data: {
        name: assetName,
        imageUrl: imageUrl,
        assetId: asset.id,
        category: initialCategory || '次要道具',
      }
    });
    onClose();
  };

  const handleTypeChange = async (category: string) => {
    if (asset.id) {
      await updateAssetCategory(asset.id, category);
      setCurrentCategory(category);
    }
    setShowTypeMenu(false);
    onClose();
  };

  // Adjust position to keep menu in viewport
  const menuStyle: React.CSSProperties = {
    left: position.x,
    top: position.y,
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={handleOverlayClick}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 min-w-[160px]"
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleViewDetails}
          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
        >
          <Eye size={14} />
          查看详情
        </button>
        
        <button
          onClick={handleDownload}
          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
        >
          <Download size={14} />
          下载
        </button>
        
        <button
          onClick={handleAddToCanvas}
          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
        >
          <Plus size={14} />
          更新资产
        </button>
        
        {/* 更改分类 */}
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <Tag size={14} />
              更改分类
            </span>
            <ChevronRight size={14} className={`transition-transform ${showTypeMenu ? 'rotate-90' : ''}`} />
          </button>
          
          {/* 子菜单 */}
          {showTypeMenu && (
            <div className="absolute left-full top-0 ml-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 min-w-[140px]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleTypeChange(cat.key)}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
                >
                  <span className={cat.color}>●</span>
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-700 my-1" />
        
        <button
          onClick={handleDeleteClick}
          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
        >
          <Trash2 size={14} />
          删除
        </button>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancelDelete} />
          <div className="relative bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-2">确认删除</h3>
            <p className="text-sm text-gray-400 mb-4">
              确定要删除资产 "{asset.name || asset.resourceName}" 吗？此操作不可撤销。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
