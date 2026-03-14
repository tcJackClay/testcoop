import { useState } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  Table, 
  Play, 
  Trash2,
  Upload,
  Image,
  Video,
  Settings,
  Sparkles,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../stores';
import StoryboardCard from './StoryboardCard';
import ShotEditor from './ShotEditor';
import type { StoryboardMode, SplitMode } from '../../types';

export default function Storyboard() {
  const { t } = useTranslation();
  const [showEditor, setShowEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const {
    shots,
    selectedShotId,
    viewMode,
    storyboardMode,
    isGenerating,
    splitMode,
    llmPrompt,
    batchQueue,
    addShot,
    selectShot,
    setViewMode,
    setStoryboardMode,
    setSplitMode,
    setLlmPrompt,
    clearAllShots,
    importFromScript,
    importFromLLM,
    importFromNovel,
    importFromTable,
    addToBatchQueue,
    removeFromBatchQueue,
    clearBatchQueue,
    generateBatch,
  } = useStoryboardStore();

  const selectedShot = shots.find((s) => s.id === selectedShotId);

  // Handle script import
  const handleImport = (type: SplitMode) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (type === 'table_summary') {
      input.accept = '.txt,.md,.csv';
    } else {
      input.accept = '.txt,.md';
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const content = ev.target?.result as string;
          switch (type) {
            case 'script':
              importFromScript(content);
              break;
            case 'novel':
              importFromNovel(content);
              break;
            case 'table_summary':
              importFromTable(content);
              break;
            default:
              importFromScript(content);
          }
          setShowImportModal(false);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Handle LLM split
  const handleLLMSplit = async (type: SplitMode) => {
    const prompt = window.prompt(t('storyboard.enterScript') || '请输入脚本内容:');
    if (!prompt) return;
    
    switch (type) {
      case 'script':
        await importFromLLM(prompt);
        break;
      case 'novel':
        await importFromNovel(prompt);
        break;
      case 'table_summary':
        await importFromTable(prompt);
        break;
    }
  };

  // Toggle shot in batch queue
  const toggleShotInBatch = (shotId: string) => {
    if (batchQueue.includes(shotId)) {
      removeFromBatchQueue(shotId);
    } else {
      addToBatchQueue([shotId]);
    }
  };

  // Select all unlocked shots
  const selectAllForBatch = () => {
    const unlockedIds = shots
      .filter((s) => s.outputEnabled && !s.locked)
      .map((s) => s.id);
    addToBatchQueue(unlockedIds);
  };

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            {/* Add Shot */}
            <button
              onClick={() => addShot()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('storyboard.addShot')}
            </button>

            {/* Import Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowImportModal(!showImportModal)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <Upload className="w-4 h-4" />
                {t('storyboard.import')}
              </button>
              
              {showImportModal && (
                <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                  <button
                    onClick={() => handleImport('script')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700"
                  >
                    从脚本导入
                  </button>
                  <button
                    onClick={() => handleImport('novel')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700"
                  >
                    从小说导入
                  </button>
                  <button
                    onClick={() => handleImport('table_summary')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700"
                  >
                    从表格导入
                  </button>
                  <hr className="my-1 border-gray-700" />
                  <button
                    onClick={() => { setShowImportModal(false); handleLLMSplit('script'); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Sparkles size={14} />
                    LLM 脚本拆分
                  </button>
                  <button
                    onClick={() => { setShowImportModal(false); handleLLMSplit('novel'); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Sparkles size={14} />
                    LLM 小说拆分
                  </button>
                  <button
                    onClick={() => { setShowImportModal(false); handleLLMSplit('table_summary'); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Sparkles size={14} />
                    LLM 表格汇总
                  </button>
                </div>
              )}
            </div>

            {/* Clear All */}
            {shots.length > 0 && (
              <button
                onClick={clearAllShots}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {t('storyboard.clear')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle: Image/Video */}
            <div className="flex bg-gray-700 rounded p-0.5">
              <button
                onClick={() => setStoryboardMode('image')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs ${
                  storyboardMode === 'image' ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
                title={t('storyboard.imageMode')}
              >
                <Image size={14} />
                图片
              </button>
              <button
                onClick={() => setStoryboardMode('video')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs ${
                  storyboardMode === 'video' ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
                title={t('storyboard.videoMode')}
              >
                <Video size={14} />
                视频
              </button>
            </div>

            {/* Batch Generate Button */}
            {shots.length > 0 && (
              <button
                onClick={generateBatch}
                disabled={batchQueue.length === 0 || isGenerating}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                  batchQueue.length === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Play className="w-4 h-4" />
                批量生成 ({batchQueue.length})
              </button>
            )}

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded ${showSettings ? 'bg-gray-600' : ''}`}
              title={t('common.settings')}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded p-0.5">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-gray-600' : ''}`}
                title={t('storyboard.cardView')}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-600' : ''}`}
                title={t('storyboard.tableView')}
              >
                <Table size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-800 border-b border-gray-700 p-3 space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-400">拆分模式:</label>
              <select
                value={splitMode}
                onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="script">脚本拆分</option>
                <option value="novel">小说拆分</option>
                <option value="custom">自定义</option>
                <option value="table_summary">表格汇总</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">LLM Prompt:</label>
              <textarea
                value={llmPrompt}
                onChange={(e) => setLlmPrompt(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white resize-none h-24"
              />
            </div>
          </div>
        )}

        {/* Batch Queue Bar */}
        {batchQueue.length > 0 && (
          <div className="bg-green-900/30 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-green-400" />
              <span className="text-sm text-green-400">
                已选择 {batchQueue.length} 个镜头待生成
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllForBatch}
                className="text-xs text-green-400 hover:text-green-300"
              >
                全选未锁定
              </button>
              <button
                onClick={clearBatchQueue}
                className="text-xs text-red-400 hover:text-red-300"
              >
                清空队列
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
          {shots.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <LayoutGrid className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('storyboard.empty')}</p>
                <p className="text-sm mt-1">{t('storyboard.emptyHint')}</p>
              </div>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shots.map((shot) => (
                <StoryboardCard
                  key={shot.id}
                  shot={shot}
                  isSelected={shot.id === selectedShotId}
                  isInBatchQueue={batchQueue.includes(shot.id)}
                  onClick={() => selectShot(shot.id)}
                  onDoubleClick={() => {
                    selectShot(shot.id);
                    setShowEditor(true);
                  }}
                  onToggleBatch={() => toggleShotInBatch(shot.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-2 py-2 text-left text-sm font-medium w-8"></th>
                    <th className="px-4 py-2 text-left text-sm font-medium">#</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">{t('storyboard.scene')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">{t('storyboard.description')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">{t('storyboard.status')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">{t('storyboard.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shots.map((shot) => (
                    <tr
                      key={shot.id}
                      className={`border-t border-gray-700 cursor-pointer ${
                        shot.id === selectedShotId ? 'bg-blue-900/30' : 'hover:bg-gray-700'
                      }`}
                      onClick={() => selectShot(shot.id)}
                    >
                      <td className="px-2 py-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleShotInBatch(shot.id); }}
                          className="text-gray-400 hover:text-white"
                        >
                          {batchQueue.includes(shot.id) ? (
                            <CheckSquare size={16} className="text-green-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-sm">{shot.shotNumber}</td>
                      <td className="px-4 py-2 text-sm">{shot.sceneNumber}</td>
                      <td className="px-4 py-2 text-sm truncate max-w-xs">{shot.description}</td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            shot.status === 'completed'
                              ? 'bg-green-900 text-green-400'
                              : shot.status === 'failed'
                              ? 'bg-red-900 text-red-400'
                              : shot.status === 'generating'
                              ? 'bg-blue-900 text-blue-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {shot.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectShot(shot.id);
                            setShowEditor(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {t('common.edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Shot Editor Panel */}
      {showEditor && selectedShot && (
        <ShotEditor
          shot={selectedShot}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white">处理中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
