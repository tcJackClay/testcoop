import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Canvas from './components/canvas/Canvas';
import SettingsModal from './features/settings/SettingsModal';
import Storyboard from './features/storyboard/Storyboard';
import History from './features/history/History';
import Models from './features/models/Models';
import ChatPanel from './features/chat/ChatPanel';
import CharactersPanel from './features/characters/CharactersPanel';
import HistoryPanel from './features/history/HistoryPanel';
import { useCanvasStore, type NodeType } from './stores/canvasStore';

export type ViewMode = 'canvas' | 'storyboard' | 'history' | 'models';

export default function App() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [charactersOpen, setCharactersOpen] = useState(false);
  
  const { selectedNodeIds, nodes, deleteNode, clearSelection } = useCanvasStore();


  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const { addNode } = useCanvasStore();

  const handleAddNode = useCallback((type: NodeType) => {
    // Add node to center of canvas view
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    addNode(type, { x, y });
    setViewMode('canvas');
  }, [addNode]);

  const handleNewProject = useCallback(() => {
    if (nodes.length > 0) {
      if (confirm('确定要新建项目吗？当前内容将被清空。')) {
        // Clear all nodes
        nodes.forEach(node => deleteNode(node.id));
        clearSelection();
      }
    }
  }, [nodes, deleteNode, clearSelection]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <Header
        viewMode={viewMode}
        onViewChange={handleViewChange}
        onSettingsClick={() => setShowSettings(true)}
        onChatClick={() => setChatOpen(!chatOpen)}
        chatOpen={chatOpen}
        onNewProject={handleNewProject}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          viewMode={viewMode}
          onViewChange={handleViewChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onAddNode={handleAddNode}
          onHistoryClick={() => setHistoryOpen(!historyOpen)}
          onCharactersClick={() => setCharactersOpen(!charactersOpen)}
          historyOpen={historyOpen}
          charactersOpen={charactersOpen}
        />
        
        {/* History Panel (left side) */}
        {historyOpen && viewMode === 'canvas' && (
          <HistoryPanel onClose={() => setHistoryOpen(false)} />
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

        {/* Characters Panel (right side) */}
        {charactersOpen && viewMode === 'canvas' && (
          <CharactersPanel onClose={() => setCharactersOpen(false)} />
        )}

        {/* Chat Panel (right side) */}
        {chatOpen && viewMode === 'canvas' && (
          <ChatPanel onClose={() => setChatOpen(false)} />
        )}
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
