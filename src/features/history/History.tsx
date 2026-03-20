import { useState, useEffect } from 'react';
import { Image, Video, Grid3X3, List, Loader2, Layout, Check, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listProjectImages, listProjectVideos, type OSSFile } from '../../api/oss';
import { useProjectStore } from '../../stores/projectStore';

type ViewMode = 'grid' | 'list';
type MediaType = 'image' | 'video';

export default function GenerationHistory() {
  const { t } = useTranslation();
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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

  // 切换全选
  const toggleSelectAll = () => {
    if (selectedItems.size === files.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(files.map(f => f.name)));
    }
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, file: OSSFile) => {
    const dragData = {
      id: file.url,
      name: file.name.split('/').pop() || 'image',
      resourceName: file.name.split('/').pop() || 'image',
      imageUrl: file.url,
      type: file.type,
      url: file.url,
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
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Toolbar */}
      <div className="h-12 bg-dark-surface border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          {/* 媒体类型切换 - 更小更简洁 */}
          <div className="flex bg-gray-700/50 rounded-lg p-0.5">
            <button
              onClick={() => setMediaType('image')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-150 ${
                mediaType === 'image' 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <Image size={12} />
              {t('history.image')}
            </button>
            <button
              onClick={() => setMediaType('video')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-150 ${
                mediaType === 'video' 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <Video size={12} />
              {t('history.video')}
            </button>
          </div>
          
          <span className="text-xs text-gray-500">
            {files.length}/100
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 全选 */}
          {files.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-600/50"
            >
              <Check size={12} className={selectedItems.size === files.length ? 'text-primary-400' : ''} />
              {selectedItems.size === files.length ? '取消' : '全选'}
            </button>
          )}

          {/* View Mode */}
          <div className="flex bg-gray-700/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-all duration-150 ${
                viewMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-all duration-150 ${
                viewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('history.empty')}</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.name}
                className={`aspect-square bg-dark-elevated rounded-lg overflow-hidden cursor-pointer relative group transition-all duration-150 ${
                  selectedItems.has(file.name) ? 'ring-2 ring-primary-500' : 'hover:ring-2 hover:ring-primary-400'
                }`}
                onClick={() => toggleSelect(file.name)}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
              >
                {/* 选择标记 */}
                {selectedItems.has(file.name) && (
                  <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}

                {file.type === 'image' ? (
                  <img src={file.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={file.url} className="w-full h-full object-cover" />
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Layout size={24} className="text-white" />
                </div>
                
                {/* 时间标签 */}
                <div className="absolute bottom-0 left-0 right-0 text-[10px] text-white/80 bg-black/50 px-2 py-1 truncate">
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
                className={`flex items-center gap-3 p-3 bg-dark-elevated rounded-lg cursor-pointer transition-all ${
                  selectedItems.has(file.name) ? 'ring-1 ring-primary-500' : 'hover:bg-dark-surface'
                }`}
                onClick={() => toggleSelect(file.name)}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
              >
                {/* 选择框 */}
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selectedItems.has(file.name) 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-gray-500 hover:border-gray-400'
                }`}>
                  {selectedItems.has(file.name) && <Check size={14} className="text-white" />}
                </div>

                {/* 缩略图 */}
                <div className="w-14 h-14 bg-gray-700 rounded-lg overflow-hidden shrink-0">
                  {file.type === 'image' ? (
                    <img src={file.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={file.url} className="w-full h-full object-cover" />
                  )}
                </div>
                
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{file.name.split('/').pop()}</p>
                  <p className="text-xs text-gray-500">
                    {formatTime(file.lastModified)} · {formatSize(file.size)}
                  </p>
                </div>

                {/* 拖拽提示 */}
                <Layout size={18} className="text-gray-500 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
