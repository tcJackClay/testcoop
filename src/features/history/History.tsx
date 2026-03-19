import { useState, useMemo } from 'react';
import { 
  Image, 
  Video, 
  Trash2, 
  Download, 
  RefreshCw,
  Filter,
  Zap,
  Grid3X3,
  List
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHistoryStore, type PerformanceMode } from '../../stores/historyStore';
import HistoryCard from './HistoryCard';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function History() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    items,
    selectedItemId,
    performanceMode,
    filterType,
    filterStatus,
    filterTemp,
    page,
    pageSize,
    total,
    selectItem,
    deleteItem,
    clearAll,
    setFilterType,
    setFilterStatus,
    setFilterTemp,
    setPerformanceMode,
    getFilteredItems,
  } = useHistoryStore();

  const filteredItems = useMemo(() => {
    return getFilteredItems().slice((page - 1) * pageSize, page * pageSize * page);
  }, [getFilteredItems, page, pageSize]);

  const handleBatchDownload = async () => {
    const zip = new JSZip();
    const imageItems = filteredItems.filter((item) => item.type === 'image' && item.imageUrls);
    
    for (const item of imageItems) {
      if (item.imageUrls) {
        for (let i = 0; i < item.imageUrls.length; i++) {
          try {
            const response = await fetch(item.imageUrls![i]);
            const blob = await response.blob();
            zip.file(`${item.id}_${i}.png`, blob);
          } catch (e) {
            console.error('Failed to download image:', e);
          }
        }
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `history_${Date.now()}.zip`);
  };

  const performanceModes: { value: PerformanceMode; label: string; icon: React.ReactNode }[] = [
    { value: 'fast', label: t('history.performanceFast'), icon: <Zap className="w-4 h-4" /> },
    { value: 'normal', label: t('history.performanceNormal'), icon: <Grid3X3 className="w-4 h-4" /> },
    { value: 'off', label: t('history.performanceOff'), icon: <List className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
              showFilters ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            {t('history.filter')}
          </button>
          
          {filterType !== 'all' && (
            <span className="text-xs text-gray-500">
              {filteredItems.length} {t('history.results')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Performance Mode */}
          <div className="flex bg-gray-700 rounded p-0.5">
            {performanceModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setPerformanceMode(mode.value)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  performanceMode === mode.value ? 'bg-gray-600' : ''
                }`}
                title={mode.label}
              >
                {mode.icon}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex bg-gray-700 rounded p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-600' : ''}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-600' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          {filteredItems.length > 0 && (
            <>
              <button
                onClick={handleBatchDownload}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                title={t('history.downloadAll')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={clearAll}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                title={t('history.clearAll')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{t('history.type')}:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="select w-32"
            >
              <option value="all">{t('history.all')}</option>
              <option value="image">{t('history.image')}</option>
              <option value="video">{t('history.video')}</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{t('history.status')}:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="select w-32"
            >
              <option value="all">{t('history.all')}</option>
              <option value="success">{t('history.success')}</option>
              <option value="failed">{t('history.failed')}</option>
              <option value="pending">{t('history.pending')}</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">资产:</span>
            <select
              value={filterTemp}
              onChange={(e) => setFilterTemp(e.target.value as any)}
              className="select w-32"
            >
              <option value="all">全部</option>
              <option value="temp">临时资产</option>
              <option value="permanent">正式资产</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('history.empty')}</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                isSelected={item.id === selectedItemId}
                onClick={() => selectItem(item.id)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => selectItem(item.id)}
                className={`flex items-center gap-4 p-3 bg-gray-800 rounded-lg cursor-pointer ${
                  item.id === selectedItemId ? 'ring-2 ring-blue-500' : 'hover:bg-gray-750'
                }`}
              >
                <div className="w-16 h-16 bg-gray-700 rounded overflow-hidden shrink-0">
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
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.prompt || 'No prompt'}</p>
                  <p className="text-xs text-gray-500">{item.modelName}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(item.createTime).toLocaleString()}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item.id);
                  }}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
