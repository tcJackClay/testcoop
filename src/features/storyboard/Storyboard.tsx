import { useState } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  Table, 
  Play, 
  Trash2,
  Upload
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../stores/storyboardStore';
import StoryboardCard from './StoryboardCard';
import ShotEditor from './ShotEditor';

export default function Storyboard() {
  const { t } = useTranslation();
  const [showEditor, setShowEditor] = useState(false);
  const {
    shots,
    selectedShotId,
    viewMode,
    isGenerating,
    addShot,
    selectShot,
    setViewMode,
    clearAllShots,
    importFromScript,
  } = useStoryboardStore();

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          importFromScript(ev.target?.result as string);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const selectedShot = shots.find((s) => s.id === selectedShotId);

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => addShot()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('storyboard.addShot')}
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              <Upload className="w-4 h-4" />
              {t('storyboard.import')}
            </button>
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

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-700 rounded p-0.5">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-gray-600' : ''}`}
                title={t('storyboard.cardView')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-600' : ''}`}
                title={t('storyboard.tableView')}
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

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
                  onClick={() => selectShot(shot.id)}
                  onDoubleClick={() => {
                    selectShot(shot.id);
                    setShowEditor(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
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
                            setShowEditor(true);
                            selectShot(shot.id);
                          }}
                          className="text-blue-400 hover:text-blue-300"
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
    </div>
  );
}
