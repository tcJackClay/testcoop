import { useState, useCallback } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Canvas from './components/canvas/Canvas';
import SettingsModal from './features/settings/SettingsModal';
import LoginModal from './components/auth/LoginModal';
import LoginPage from './components/auth/LoginPage';
import Storyboard from './features/storyboard/Storyboard';
import History from './features/history/History';
import Models from './features/models/Models';
import ProjectPanel from './features/projects/ProjectPanel';
import LeftPanel, { type LeftPanelType } from './components/leftPanel/LeftPanel';
import RightPanel, { type RightPanelType } from './components/rightPanel/RightPanel';
import { useCanvasStore, type NodeType } from './stores/canvasStore';
import { useAuthStore } from './stores/authStore';
import { useProjectStore } from './stores/projectStore';

export type ViewMode = 'login' | 'canvas' | 'storyboard' | 'history' | 'models' | 'projects';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leftPanel, setLeftPanel] = useState<LeftPanelType>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  
  const { addNode } = useCanvasStore();
  const { token } = useAuthStore();
  const { currentProject } = useProjectStore();

  const handleViewChange = useCallback((mode: ViewMode) => {
    // 未登录只能访问登录页面
    if (!token && mode !== 'login') return;
    // 未选择项目只能访问项目列表
    if (!currentProject && mode !== 'login' && mode !== 'projects') return;
    setViewMode(mode);
  }, [token, currentProject]);

  const handleAddNode = useCallback((type: NodeType) => {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    addNode(type, { x, y });
    setViewMode('canvas');
  }, [addNode]);

  const handleLeftPanelChange = useCallback((type: LeftPanelType) => {
    setLeftPanel(prev => prev === type ? null : type);
  }, []);

  const handleRightPanelChange = useCallback((type: RightPanelType) => {
    setRightPanel(prev => prev === type ? null : type);
  }, []);

  // 初始跳转：只在新加载时检查一次
  const initialized = useState(() => {
    if (!token) {
      setViewMode('login');
    } else if (!currentProject) {
      setViewMode('projects');
    }
    return true;
  });

  // 判断是否显示 sidebar（只在 canvas 模式下显示）
  const showSidebar = viewMode === 'canvas';
  const showHeader = viewMode !== 'login';

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {showHeader && (
        <Header
          viewMode={viewMode}
          onViewChange={handleViewChange}
          onSettingsClick={() => setShowSettings(true)}
          onChatClick={() => handleRightPanelChange('chat')}
          chatOpen={rightPanel === 'chat'}
          onProjectClick={() => setViewMode('projects')}
        />
      )}
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - 只在 canvas 模式下显示 */}
        {showSidebar && (
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
        )}
        
        {/* Left Panel */}
        {leftPanel && viewMode === 'canvas' && (
          <LeftPanel type={leftPanel} onClose={() => setLeftPanel(null)} />
        )}

        <main className="flex-1 flex overflow-hidden">
          {viewMode === 'login' && (
            <div className="flex-1 flex items-center justify-center">
              <LoginPage />
            </div>
          )}
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
          {viewMode === 'projects' && <ProjectPanel onBackToCanvas={() => setViewMode('canvas')} />}
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
