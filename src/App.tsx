import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Canvas from './components/canvas/Canvas';
import NodePropertiesPanel from './components/canvas/NodePropertiesPanel';
import SettingsModal from './features/settings/SettingsModal';
import Storyboard from './features/storyboard/Storyboard';
import Models from './features/models/Models';
import { useCanvasStore } from './stores/canvasStore';

export type ViewMode = 'canvas' | 'storyboard' | 'history' | 'models';

export default function App() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false);
  
  const { selectedNodeIds } = useCanvasStore();

  // Show properties panel when a node is selected in canvas view
  useEffect(() => {
    if (viewMode === 'canvas' && selectedNodeIds.length > 0) {
      setPropertiesPanelOpen(true);
    } else if (viewMode !== 'canvas') {
      setPropertiesPanelOpen(false);
    }
  }, [selectedNodeIds.length, viewMode]);

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
        
        <main className="flex-1 flex overflow-hidden">
          {viewMode === 'canvas' && (
            <div className="flex-1 flex">
              <div className="flex-1">
                <Canvas />
              </div>
              {propertiesPanelOpen && (
                <NodePropertiesPanel 
                  onClose={() => setPropertiesPanelOpen(false)} 
                />
              )}
            </div>
          )}
          {viewMode === 'storyboard' && <Storyboard />}
          {viewMode === 'history' && <History />}
          {viewMode === 'models' && <Models />}
        </main>
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
