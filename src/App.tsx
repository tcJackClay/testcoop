import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Canvas from './components/canvas/Canvas';
import SettingsModal from './features/settings/SettingsModal';
import Storyboard from './features/storyboard/Storyboard';
import History from './features/history/History';

export type ViewMode = 'canvas' | 'storyboard' | 'history' | 'models';

export default function App() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <Header
        viewMode={viewMode}
        onViewChange={handleViewChange}
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          viewMode={viewMode}
          onViewChange={handleViewChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-hidden">
          {viewMode === 'canvas' && <Canvas />}
          {viewMode === 'storyboard' && <Storyboard />}
          {viewMode === 'history' && <History />}
          {viewMode === 'models' && (
            <div className="h-full flex items-center justify-center text-gray-400">
              {t('common.comingSoon')} - Models
            </div>
          )}
        </main>
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
