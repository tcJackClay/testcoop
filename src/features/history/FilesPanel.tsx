import { useState, useEffect } from 'react';
import { X, Zap, FolderOpen, Layers, Trash2, Download, Image, Video, Grid3X3, List, RefreshCw, MessageCircle, Layout, MoreVertical, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listProjectImages, listProjectVideos, type OSSFile } from '../../api/oss';
import { useProjectStore } from '../../stores/projectStore';

type ViewMode = 'grid' | 'list';
type MediaType = 'image' | 'video';

export default function FilesPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [performanceMode, setPerformanceMode] = useState<'off' | 'normal' | 'ultra'>('normal');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [files, setFiles] = useState<OSSFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const { currentProject } = useProjectStore();
  const projectId = currentProject?.id || 1;

  // 加载文件列表
  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);
      try {
        const data = mediaType === 'image' 
          ? await listProjectImages(projectId, 100)
          : await listProjectVideos(projectId, 100);
        setFiles(data);
      } catch (error) {
        console.error('加载文件列表失败:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadFiles();
  }, [mediaType, projectId]);

  // 切换媒体类型时清空选择
  useEffect(() => {
    setSelectedItems(new Set());
  }, [mediaType]);

  // 切换全选
  const toggleSelectAll = () => {
    if (selectedItems.size === files.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(files.map(f => f.name)));
    }
  };

  // 切换单个选择
  const toggleSelect = (fileName: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedItems(newSelected);
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, file: OSSFile) => {
    // 构造与资产卡相同的数据格式，以便 Canvas 统一处理
    const dragData = {
      id: file.url,  // 使用 URL 作为 ID（临时方案）
      name: file.name.split('/').pop() || 'image',
      resourceName: file.name.split('/').pop() || 'image',
      imageUrl: file.url,  // 直接使用 OSS URL
      type: file.type,
      url: file.url,
      // 用于区分是 OSS 历史文件
      isHistoryFile: true,
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="h-12 border-b border-gray-700 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* 媒体类型切换 - 放在左边 */}
          <button
            onClick={() => setMediaType('image')}
            className={`p-1.5 rounded ${mediaType === 'image' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            title="图片"
          >
            <Image size={14} />
          </button>
          <button
            onClick={() => setMediaType('video')}
            className={`p-1.5 rounded ${mediaType === 'video' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            title="视频"
          >
            <Video size={14} />
          </button>
          <div>
            <h3 className="text-xs font-bold text-gray-300">
              {mediaType === 'image' ? '图片' : '视频'}
            </h3>
            <span className="text-[9px] text-gray-500">{files.length}/100</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="h-10 border-b border-gray-700 flex items-center justify-between px-3">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-dark-surface text-white' : 'text-gray-500'}`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-dark-surface text-white' : 'text-gray-500'}`}
          >
            <List size={14} />
          </button>
        </div>
        {selectedItems.size > 0 && (
          <div className="flex gap-1">
            <span className="text-[10px] text-primary-400">
              已选 {selectedItems.size} 项
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {mediaType === 'image' ? (
              <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            ) : (
              <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
            )}
            <p className="text-xs">暂无{mediaType === 'image' ? '图片' : '视频'}历史</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {files.map((file) => (
              <div
                key={file.name}
                className={`aspect-square bg-dark-elevated rounded-lg overflow-hidden cursor-pointer relative group ${
                  selectedItems.has(file.name) ? 'ring-2 ring-primary-500' : ''
                }`}
                onMouseEnter={() => setHoveredItem(file.name)}
                onMouseLeave={() => setHoveredItem(null)}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
              >
                {/* 选择框 */}
                <div 
                  className="absolute top-2 left-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(file.name);
                  }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedItems.has(file.name) 
                      ? 'bg-primary-500 border-primary-500' 
                      : 'border-gray-500 hover:border-gray-400'
                  }`}>
                    {selectedItems.has(file.name) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {file.type === 'image' ? (
                  <img src={file.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={file.url} className="w-full h-full object-cover" />
                )}
                
                {/* Hover overlay */}
                {hoveredItem === file.name && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Layout size={20} className="text-white" />
                  </div>
                )}
                
                {/* 时间标签 */}
                <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white/80 bg-black/50 rounded px-1 truncate">
                  {formatTime(file.lastModified)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className={`flex items-center gap-2 p-2 bg-dark-elevated rounded-lg cursor-pointer ${
                  selectedItems.has(file.name) ? 'ring-1 ring-primary-500' : ''
                }`}
                onMouseEnter={() => setHoveredItem(file.name)}
                onMouseLeave={() => setHoveredItem(null)}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
              >
                {/* 选择框 */}
                <div 
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(file.name);
                  }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedItems.has(file.name) 
                      ? 'bg-primary-500 border-primary-500' 
                      : 'border-gray-500 hover:border-gray-400'
                  }`}>
                    {selectedItems.has(file.name) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 缩略图 */}
                <div className="w-12 h-12 bg-gray-700 rounded overflow-hidden shrink-0">
                  {file.type === 'image' ? (
                    <img src={file.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={file.url} className="w-full h-full object-cover" />
                  )}
                </div>
                
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{file.name.split('/').pop()}</p>
                  <p className="text-[10px] text-gray-500">
                    {formatTime(file.lastModified)} · {formatSize(file.size)}
                  </p>
                </div>
                
                {/* Hover 图标 */}
                {hoveredItem === file.name && (
                  <Layout size={16} className="text-gray-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-white hover:bg-dark-elevated rounded-lg transition-colors z-10"
      >
        <X size={16} />
      </button>
    </div>
  );
}
