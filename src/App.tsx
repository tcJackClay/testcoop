import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Canvas from './components/canvas/Canvas';
import SettingsModal from './features/settings/SettingsModal';
import LoginModal from './components/auth/LoginModal';
import Storyboard from './features/storyboard/Storyboard';
import History from './features/history/History';
import Models from './features/models/Models';
import LeftPanel, { type LeftPanelType } from './components/leftPanel/LeftPanel';
import RightPanel, { type RightPanelType } from './components/rightPanel/RightPanel';
import { useCanvasStore, type NodeType } from './stores/canvasStore';

export type ViewMode = 'canvas' | 'storyboard' | 'history' | 'models';

export default function App() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leftPanel, setLeftPanel] = useState<LeftPanelType>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  
  const { selectedNodeIds, nodes, deleteNode, clearSelection, addNode } = useCanvasStore();

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleAddNode = useCallback((type: NodeType) => {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    addNode(type, { x, y });
    setViewMode('canvas');
  }, [addNode]);

  const handleNewProject = useCallback(() => {
    if (nodes.length > 0) {
      if (confirm('确定要新建项目吗？当前内容将被清空。')) {
        nodes.forEach(node => deleteNode(node.id));
        clearSelection();
      }
    }
  }, [nodes, deleteNode, clearSelection]);

  const handleLeftPanelChange = useCallback((type: LeftPanelType) => {
    setLeftPanel(prev => prev === type ? null : type);
  }, []);

  const handleRightPanelChange = useCallback((type: RightPanelType) => {
    setRightPanel(prev => prev === type ? null : type);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <Header
        viewMode={viewMode}
        onViewChange={handleViewChange}
        onSettingsClick={() => setShowSettings(true)}
        onChatClick={() => handleRightPanelChange('chat')}
        chatOpen={rightPanel === 'chat'}
        onNewProject={handleNewProject}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          viewMode={viewMode}
          onViewChange={handleViewChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onAddNode={handleAddNode}
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          onLeftPanelChange={handleLeftPanelChange}
          onRightPanelChange={handleRightPanelChange}
        />
        
        {/* Left Panel */}
        {leftPanel && viewMode === 'canvas' && (
          <LeftPanel type={leftPanel} onClose={() => setLeftPanel(null)} />
        )}

        <main className="flex-1 flex overflow-hidden">
          {viewMode === 'canvas' && (
            <div className="flex-1 flex">
              <div className="flex-1">
                <Canvas />
              </div>
            </div>
          )}
          {viewMode === 'storyboard' && <Storyboard />}
          {viewMode === 'history' && <History />}
          {viewMode === 'models' && <Models />}
        </main>

        {/* Right Panel */}
        {rightPanel && viewMode === 'canvas' && (
          <RightPanel type={rightPanel} onClose={() => setRightPanel(null)} />
        )}
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      <LoginModal />
    </div>
  );
}
