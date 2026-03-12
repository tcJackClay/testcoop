// Canvas Connections Hook - 连线功能封装 (Tapnow 风格)
import { useState, useCallback } from 'react';
import { useCanvasStore, type CanvasNode, type Connection } from '../../stores/canvasStore';
import ConnectionLine from '../nodes/ConnectionLine';

interface UseCanvasConnectionsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewPort: { x: number; y: number; zoom: number };
}

export interface UseCanvasConnectionsReturn {
  // 状态 - 支持双向连接
  connectingSource: string | null;    // 从输出端口开始
  connectingTarget: string | null;    // 从输入端口开始
  connectingInputType: string | null; // 'default', 'oref', 'sref'
  mousePos: { x: number; y: number };
  hoverTargetId: string | null;
  
  // 处理器（传递给 NodeRenderer）
  onSourceMouseDown: (nodeId: string, worldPos: { x: number; y: number }) => void;
  onTargetMouseDown: (nodeId: string, inputType: string, worldPos: { x: number; y: number }) => void;
  onNodeMouseUp: (nodeId: string, inputType?: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  cancelConnection: () => void;
  
  // Canvas 事件处理器
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasClick: () => void;
  onCanvasMouseDown: () => void;
  
  // 渲染组件
  ConnectionRenderer: () => React.ReactNode;
}

export function useCanvasConnections({
  containerRef,
  viewPort,
}: UseCanvasConnectionsProps): UseCanvasConnectionsReturn {
  // 状态 - 支持双向连接（Tapnow 风格）
  const [connectingSource, setConnectingSource] = useState<string | null>(null);    // 从输出端口开始
  const [connectingTarget, setConnectingTarget] = useState<string | null>(null);    // 从输入端口开始
  const [connectingInputType, setConnectingInputType] = useState<string | null>(null); // 'default', 'oref', 'sref'
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);

  const { nodes, connections, selectedNodeIds, addConnection, deleteConnection } = useCanvasStore();

  // 从 Source 开始的连接 - onMouseDown
  const onSourceMouseDown = useCallback((nodeId: string, worldPos: { x: number; y: number }) => {
    setMousePos(worldPos);
    setConnectingSource(nodeId);
    // 清除其他连接状态
    setConnectingTarget(null);
    setConnectingInputType(null);
  }, []);

  // 从 Target 开始的连接 - onMouseDown
  const onTargetMouseDown = useCallback((
    nodeId: string, 
    inputType: string = 'default',
    worldPos: { x: number; y: number }
  ) => {
    setMousePos(worldPos);
    setConnectingSource(null);
    setConnectingTarget(nodeId);
    setConnectingInputType(inputType);
  }, []);

  // 核心连接处理函数 - onMouseUp（统一处理两种方向的连接）
  const onNodeMouseUp = useCallback((nodeId: string, inputType: string = 'default') => {
    // 场景1: 从 Source 连接到 Target
    if (connectingSource && connectingSource !== nodeId) {
      // 检查是否已存在相同连接
      const exists = connections.some((c) =>
        c.sourceId === connectingSource &&
        c.targetId === nodeId &&
        (c.inputType || 'default') === inputType
      );
      
      if (!exists) {
        addConnection(connectingSource, nodeId, inputType);
      }
    }
    // 场景2: 从 Target 连接到 Source（反向连接）
    else if (connectingTarget && connectingTarget !== nodeId) {
      const actualInputType = connectingInputType || inputType;
      const exists = connections.some((c) =>
        c.sourceId === nodeId &&
        c.targetId === connectingTarget &&
        (c.inputType || 'default') === actualInputType
      );
      
      if (!exists) {
        // 反向添加连接: nodeId -> connectingTarget
        addConnection(nodeId, connectingTarget, actualInputType);
      }
    }
    
    // 清除所有连接状态
    setConnectingSource(null);
    setConnectingTarget(null);
    setConnectingInputType(null);
    setHoverTargetId(null);
  }, [connectingSource, connectingTarget, connectingInputType, connections, addConnection]);

  // 删除连接
  const onDeleteConnection = useCallback((connectionId: string) => {
    deleteConnection(connectionId);
  }, [deleteConnection]);

  // 取消连接
  const cancelConnection = useCallback(() => {
    setConnectingSource(null);
    setConnectingTarget(null);
    setConnectingInputType(null);
    setHoverTargetId(null);
  }, []);

  // Canvas 鼠标移动 - 更新连线预览位置
  const onCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - (rect.left || 0);
    const y = e.clientY - (rect.top || 0);
    
    const worldX = (x - viewPort.x) / viewPort.zoom;
    const worldY = (y - viewPort.y) / viewPort.zoom;
    setMousePos({ x: worldX, y: worldY });
  }, [containerRef, viewPort.x, viewPort.y, viewPort.zoom]);

  // Canvas 点击 - 空白处取消连接
  const onCanvasClick = useCallback(() => {
    cancelConnection();
  }, [cancelConnection]);

  // Canvas 鼠标按下 - 取消连接
  const onCanvasMouseDown = useCallback(() => {
    cancelConnection();
  }, [cancelConnection]);

  // 渲染连线
  const ConnectionRenderer = useCallback(() => (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* 已建立的连线 */}
        {connections.map((conn) => (
          <ConnectionLine 
            key={conn.id} 
            connection={conn} 
            nodes={nodes}
            selectedNodeId={selectedNodeIds[0]}
            onDeleteConnection={onDeleteConnection}
          />
        ))}
        
        {/* 连线预览 - Source 方向（从右侧出发） */}
        {connectingSource && (() => {
          const sourceNode = nodes.find(n => n.id === connectingSource);
          if (!sourceNode) return null;
          
          // Source 在节点右侧 - 考虑连接点偏移 (-6px)
          const startX = sourceNode.position.x + (sourceNode.width || 200) - 6;
          const startY = sourceNode.position.y + (sourceNode.height || 80) / 2;
          
          const path = `M ${startX} ${startY} C ${startX + 100} ${startY}, ${mousePos.x - 100} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
          
          return (
            <path 
              d={path} 
              stroke="#60a5fa" 
              strokeWidth="2" 
              fill="none" 
              strokeDasharray="4,4" 
            />
          );
        })()}

        {/* 连线预览 - Target 方向（反向，从左侧出发） */}
        {connectingTarget && (() => {
          const targetNode = nodes.find(n => n.id === connectingTarget);
          if (!targetNode) return null;
          
          // Target 在节点左侧 - 考虑连接点偏移 (+6px)
          const startX = targetNode.position.x + 6;
          const startY = targetNode.position.y + (targetNode.height || 80) / 2;
          
          // 反向曲线
          const path = `M ${startX} ${startY} C ${startX - 100} ${startY}, ${mousePos.x + 100} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
          
          return (
            <path 
              d={path} 
              stroke="#60a5fa" 
              strokeWidth="2" 
              fill="none" 
              strokeDasharray="4,4" 
            />
          );
        })()}
      </svg>
    </>
  ), [connections, nodes, selectedNodeIds, connectingSource, connectingTarget, mousePos, onDeleteConnection]);

  return {
    connectingSource,
    connectingTarget,
    connectingInputType,
    mousePos,
    hoverTargetId,
    onSourceMouseDown,
    onTargetMouseDown,
    onNodeMouseUp,
    onDeleteConnection,
    cancelConnection,
    onCanvasMouseMove,
    onCanvasClick,
    onCanvasMouseDown,
    ConnectionRenderer,
  };
}
