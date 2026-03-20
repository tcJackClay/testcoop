import { useState } from 'react';
import { X, Zap, FolderOpen, Layers, Trash2, Download, Image, Video, Grid3X3, List, RefreshCw, MessageCircle, Layout, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHistoryStore } from '../../stores/historyStore';
import type { HistoryItem } from '../../types';

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [performanceMode, setPerformanceMode] = useState<'off' | 'normal' | 'ultra'>('normal');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ item: HistoryItem; x: number; y: number } | null>(null);
  
  const { items, clearAll, sendToCanvas, sendToChat, rebuildThumbnail, getCacheSize } = useHistoryStore();

  const handleContextMenu = (e: React.MouseEvent, item: HistoryItem) => {
    e.preventDefault();
    setContextMenu({ item, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  // Format cache size
  const formatCacheSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full" onClick={closeContextMenu}>
      {/* Header */}
      <div className="h-12 border-b border-gray-700 flex items-center justify-between px-3 shrink-0">
        <div>
          <h3 className="text-xs font-bold text-gray-300">生成历史</h3>
          <span className="text-[9px] text-gray-500">{items.length}/100</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const modes = ['off', 'normal', 'ultra'];
              const idx = modes.indexOf(performanceMode);
              setPerformanceMode(modes[(idx + 1) % 3] as any);
            }}
            className={`p-1.5 rounded ${
              performanceMode === 'ultra' ? 'text-orange-400 bg-orange-500/20' :
              performanceMode === 'normal' ? 'text-green-400 bg-green-500/20' :
              'text-gray-500'
            }`}
            title="性能模式"
          >
            <Zap size={14} />
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-300 rounded" title={`缓存: ${formatCacheSize(getCacheSize())}`}>
            <FolderOpen size={14} />
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-300 rounded">
            <Layers size={14} />
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="h-10 border-b border-gray-700 flex items-center justify-between px-3">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-700' : ''}`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-700' : ''}`}
          >
            <List size={14} />
          </button>
        </div>
        {items.length > 0 && (
          <div className="flex gap-1">
            <button className="p-1.5 text-gray-500 hover:text-gray-300 rounded" title="批量下载">
              <Download size={14} />
            </button>
            <button 
              onClick={clearAll}
              className="p-1.5 text-gray-500 hover:text-red-400 rounded" 
              title="清空"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">暂无历史记录</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {items.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="aspect-square bg-gray-700 rounded overflow-hidden cursor-pointer hover:ring-2 ring-blue-500 relative group"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onClick={(e) => {
                  if (e.shiftKey || e.ctrlKey) {
                    handleContextMenu(e, item);
                  }
                }}
              >
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.type === 'image' ? (
                      <Image className="w-6 h-6 text-gray-500" />
                    ) : (
                      <Video className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                )}
                
                {/* Hover overlay with actions */}
                {hoveredItem === item.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); sendToCanvas(item); }}
                      className="p-2 bg-primary-600 hover:bg-primary-500 rounded-full"
                      title="发送到画布"
                    >
                      <Layout size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); sendToChat(item); }}
                      className="p-2 bg-green-600 hover:bg-green-500 rounded-full"
                      title="发送到聊天"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); rebuildThumbnail(item.id); }}
                      className="p-2 bg-gray-600 hover:bg-gray-500 rounded-full"
                      title="重建缩略图"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                )}
                
                {/* Status badge */}
                {item.status === 'success' && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
                {item.status === 'failed' && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
                {item.status === 'pending' && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 relative group"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onClick={(e) => {
                  if (e.shiftKey || e.ctrlKey) {
                    handleContextMenu(e, item);
                  }
                }}
              >
                <div className="w-12 h-12 bg-gray-600 rounded overflow-hidden shrink-0">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === 'image' ? (
                        <Image className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Video className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{item.prompt || '无提示词'}</p>
                  <p className="text-[10px] text-gray-500">{item.modelName}</p>
                </div>
                
                {/* Hover actions for list view */}
                {hoveredItem === item.id && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); sendToCanvas(item); }}
                      className="p-1.5 bg-primary-600 hover:bg-primary-500 rounded"
                      title="发送到画布"
                    >
                      <Layout size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); sendToChat(item); }}
                      className="p-1.5 bg-green-600 hover:bg-green-500 rounded"
                      title="发送到聊天"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); rebuildThumbnail(item.id); }}
                      className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded"
                      title="重建缩略图"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { sendToCanvas(contextMenu.item); closeContextMenu(); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          >
            <Layout size={14} />
            发送到画布
          </button>
          <button
            onClick={() => { sendToChat(contextMenu.item); closeContextMenu(); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          >
            <MessageCircle size={14} />
            发送到聊天
          </button>
          <button
            onClick={() => { rebuildThumbnail(contextMenu.item.id); closeContextMenu(); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw size={14} />
            重建缩略图
          </button>
          <hr className="my-1 border-gray-600" />
          <button
            onClick={() => { 
              const url = contextMenu.item.type === 'image' ? contextMenu.item.imageUrls?.[0] : contextMenu.item.videoUrl;
              if (url) window.open(url, '_blank');
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          >
            <Download size={14} />
            下载原文件
          </button>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white rounded"
      >
        <X size={14} />
      </button>
    </div>
  );
}
