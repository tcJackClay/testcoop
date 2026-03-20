// src/pages/CanvasPage.tsx - 画布页面
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Canvas from '../components/canvas/Canvas';
import SettingsModal from '../features/settings/SettingsModal';
import LoginModal from '../components/auth/LoginModal';
import Storyboard from '../features/storyboard/Storyboard';
import History from '../features/history/History';
import Models from '../features/models/Models';
import LeftPanel, { type LeftPanelType } from '../components/leftPanel/LeftPanel';
import RightPanel, { type RightPanelType } from '../components/rightPanel/RightPanel';
import { useCanvasStore, type NodeType } from '../stores/canvasStore';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';

export type ViewMode = 'canvas' | 'storyboard' | 'history' | 'models';

export default function CanvasPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leftPanel, setLeftPanel] = useState<LeftPanelType>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  
  const { addNode } = useCanvasStore();
  const { logout } = useAuthStore();
  const { currentProject } = useProjectStore();

  // 未选择项目时跳转到项目列表
  useEffect(() => {
    if (!currentProject) {
      navigate('/projects', { replace: true });
    }
  }, [currentProject, navigate]);

  const handleViewChange = useCallback((mode: 'canvas' | 'storyboard' | 'history' | 'models') => {
    setViewMode(mode);
  }, []);

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

  const handleProjectClick = () => {
    navigate('/projects');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showSidebar = viewMode === 'canvas';

  return (
    <div className="h-screen flex flex-col bg-dark-bg text-white overflow-hidden">
      <Header
        viewMode={viewMode}
        onViewChange={handleViewChange}
        onSettingsClick={() => setShowSettings(true)}
        onProjectClick={handleProjectClick}
        onLogout={handleLogout}
      />
      
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
          {viewMode === 'canvas' && (
            <div className="flex-1 flex">
              <div className="flex-1">
                <Canvas leftPanelOpen={!!leftPanel} />
              </div>
            </div>
          )}
          {viewMode === 'storyboard' && <div className="flex-1"><Storyboard /></div>}
          {viewMode === 'history' && <div className="flex-1"><History /></div>}
          {viewMode === 'models' && <div className="flex-1"><Models /></div>}
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
