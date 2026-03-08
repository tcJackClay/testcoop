import { Trash2, Download, Plus, Eye } from 'lucide-react';
import type { Image as AssetImage } from '../../api/image';

interface ContextMenuProps {
  asset: AssetImage;
  position: { x: number; y: number };
  onClose: () => void;
  onAddToCanvas: (asset: AssetImage) => void;
  onDelete: (asset: AssetImage) => void;
  onViewDetails?: (asset: AssetImage) => void;
}

export default function ContextMenu({ 
  asset, 
  position, 
  onClose, 
  onAddToCanvas, 
  onDelete,
  onViewDetails 
}: ContextMenuProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddToCanvas = () => {
    onAddToCanvas(asset);
    onClose();
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
          onClick={handleAddToCanvas}
          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
        >
          <Plus size={14} />
          添加到画布
        </button>
        
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
