// ============================================================
// Tapnow 风格连线实现 - 需要更新的代码
// ============================================================

import { useState, useCallback } from 'react';
import { useCanvasStore, type CanvasNode, type Connection } from '../../stores/canvasStore';
import ConnectionLine from '../nodes/ConnectionLine';

// ============================================================
// 1. 状态定义 - 扩展为3个状态（支持双向连接）
// ============================================================
const [connectingSource, setConnectingSource] = useState<string | null>(null);    // 从输出端口开始
const [connectingTarget, setConnectingTarget] = useState<string | null>(null);    // 从输入端口开始
const [connectingInputType, setConnectingInputType] = useState<string | null>(null); // 'default', 'oref', 'sref'
const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);

// ============================================================
// 2. 核心连接处理函数 - handleNodeMouseUp
// ============================================================
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
            // 如果连接到特定输入点，先删除该输入点的旧连接
            if (inputType !== 'default') {
                // 删除旧连接逻辑
            }
            
            // 添加新连接
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

// ============================================================
// 3. Source Handle 事件处理 - onMouseDown
// ============================================================
const onSourceMouseDown = useCallback((nodeId: string, worldPos: { x: number; y: number }) => {
    setMousePos(worldPos);
    setConnectingSource(nodeId);
}, []);

// ============================================================
// 4. Target Handle 事件处理 - onMouseDown + onMouseUp
// ============================================================
const onTargetMouseDown = useCallback((
    nodeId: string, 
    inputType: string = 'default',
    worldPos: { x: number; y: number }
) => {
    setMousePos(worldPos);
    setConnectingTarget(nodeId);
    setConnectingInputType(inputType);
}, []);

const onTargetMouseUp = useCallback((nodeId: string, inputType: string = 'default') => {
    onNodeMouseUp(nodeId, inputType);
}, [onNodeMouseUp]);

// ============================================================
// 5. Canvas 鼠标移动处理
// ============================================================
const onCanvasMouseMove = useCallback((worldPos: { x: number; y: number }) => {
    setMousePos(worldPos);
    
    // 更新悬停目标（用于显示绿色边框）
    if (connectingSource || connectingTarget) {
        // 可以在这里检测悬停的节点
    }
}, [connectingSource, connectingTarget]);

// ============================================================
// 6. Canvas 点击处理 - 取消连接或显示菜单
// ============================================================
const onCanvasClick = useCallback((e: React.MouseEvent) => {
    if (connectingSource) {
        // 可以显示从该节点添加的菜单
        setConnectingSource(null);
    } else if (connectingTarget) {
        // 可以显示参考图选择菜单
        setConnectingTarget(null);
        setConnectingInputType(null);
    }
}, [connectingSource, connectingTarget]);

// ============================================================
// 7. 连线预览渲染
// ============================================================
const renderConnectionPreview = () => {
    // Source 开始的预览线（从节点右侧出发）
    if (connectingSource) {
        const sourceNode = nodes.find(n => n.id === connectingSource);
        if (sourceNode) {
            const startX = sourceNode.position.x + 180; // 节点宽度
            const startY = sourceNode.position.y + 40;  // 节点高度的一半
            const path = `M ${startX} ${startY} C ${startX + 100} ${startY}, ${mousePos.x - 100} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
            return <path d={path} stroke="#60a5fa" strokeWidth="2" fill="none" strokeDasharray="4,4" />;
        }
    }
    
    // Target 开始的预览线（从节点左侧出发，反向）
    if (connectingTarget) {
        const targetNode = nodes.find(n => n.id === connectingTarget);
        if (targetNode) {
            const startX = targetNode.position.x;         // 左侧
            const startY = targetNode.position.y + 40;
            const path = `M ${startX} ${startY} C ${startX - 100} ${startY}, ${mousePos.x + 100} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
            return <path d={path} stroke="#60a5fa" strokeWidth="2" fill="none" strokeDasharray="4,4" />;
        }
    }
    
    return null;
};

// ============================================================
// 8. NodeRenderer 需要的 Props
// ============================================================
interface NodeRendererConnectionProps {
    connectingSource: string | null;
    connectingTarget: string | null;
    connectingInputType: string | null;
    mousePos: { x: number; y: number };
    hoverTargetId: string | null;
    onSourceMouseDown: (nodeId: string, worldPos: { x: number; y: number }) => void;
    onTargetMouseDown: (nodeId: string, inputType: string, worldPos: { x: number; y: number }) => void;
    onTargetMouseUp: (nodeId: string, inputType: string) => void;
}

// ============================================================
// 9. NodeRenderer 中 Handle 的渲染（更新后）
// ============================================================
/*
// Target Handle（左侧输入）
<div
    className="input-point"
    style={{
        position: 'absolute',
        top: '50%',
        left: '-0.25rem',
        width: '0.5rem',
        height: '0.5rem',
        backgroundColor: isConnected ? '#60a5fa' : '#52525b',
        borderRadius: '50%',
        zIndex: 20,
        pointerEvents: 'auto'
    }}
    onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const world = screenToWorld(e.clientX, e.clientY);
        onTargetMouseDown(node.id, 'default', world);
    }}
    onMouseUp={(e) => {
        e.stopPropagation();
        onTargetMouseUp(node.id, 'default');
    }}
/>

// Source Handle（右侧输出）
<div
    className={`connector connector-right ${connectingSource === node.id ? 'active' : ''}`}
    style={{
        position: 'absolute',
        top: '50%',
        right: '-0.45rem',
        width: '0.9rem',
        height: '0.9rem',
        backgroundColor: connectingSource === node.id ? '#d4d4d8' : '#27272a',
        border: '1px solid #71717a',
        borderRadius: '50%',
        cursor: 'crosshair',
        zIndex: 30,
        opacity: connectingSource === node.id ? 1 : 0.5,
        pointerEvents: 'auto'
    }}
    onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const world = screenToWorld(e.clientX, e.clientY);
        onSourceMouseDown(node.id, world);
    }}
>
    <Plus size={10} />
</div>
*/

// ============================================================
// 10. 完整的 useCanvasConnections Hook（建议实现）
// ============================================================
/*
import { useState, useCallback } from 'react';
import { useCanvasStore, type CanvasNode, type Connection } from '../../stores/canvasStore';
import ConnectionLine from '../nodes/ConnectionLine';

interface UseCanvasConnectionsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewPort: { x: number; y: number; zoom: number };
}

export function useCanvasConnections({
  containerRef,
  viewPort,
}: UseCanvasConnectionsProps) {
  // 状态 - 支持双向连接
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [connectingTarget, setConnectingTarget] = useState<string | null>(null);
  const [connectingInputType, setConnectingInputType] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);

  const { nodes, connections, selectedNodeIds, addConnection, deleteConnection } = useCanvasStore();

  // 从 Source 开始的连接
  const onSourceMouseDown = useCallback((nodeId: string, worldPos: { x: number; y: number }) => {
    setMousePos(worldPos);
    setConnectingSource(nodeId);
    setConnectingTarget(null);
    setConnectingInputType(null);
  }, []);

  // 从 Target 开始的连接
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

  // 节点鼠标松开 - 核心连接逻辑
  const onNodeMouseUp = useCallback((nodeId: string, inputType: string = 'default') => {
    // 场景1: Source -> Target
    if (connectingSource && connectingSource !== nodeId) {
      const exists = connections.some((c) =>
        c.sourceId === connectingSource &&
        c.targetId === nodeId &&
        (c.inputType || 'default') === inputType
      );
      
      if (!exists) {
        addConnection(connectingSource, nodeId, inputType);
      }
    }
    // 场景2: Target <- Source (反向)
    else if (connectingTarget && connectingTarget !== nodeId) {
      const actualInputType = connectingInputType || inputType;
      const exists = connections.some((c) =>
        c.sourceId === nodeId &&
        c.targetId === connectingTarget &&
        (c.inputType || 'default') === actualInputType
      );
      
      if (!exists) {
        addConnection(nodeId, connectingTarget, actualInputType);
      }
    }
    
    // 清除状态
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
  }, []);

  // Canvas 鼠标移动
  const onCanvasMouseMove = useCallback((worldPos: { x: number; y: number }) => {
    setMousePos(worldPos);
  }, []);

  // Canvas 点击
  const onCanvasClick = useCallback(() => {
    cancelConnection();
  }, [cancelConnection]);

  // Canvas 鼠标按下
  const onCanvasMouseDown = useCallback(() => {
    cancelConnection();
  }, [cancelConnection]);

  // 渲染连线
  const ConnectionRenderer = useCallback(() => (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map((conn) => (
          <ConnectionLine 
            key={conn.id} 
            connection={conn} 
            nodes={nodes}
            selectedNodeId={selectedNodeIds[0]}
            onDeleteConnection={onDeleteConnection}
          />
        ))}
        
        {/* 连线预览 - Source 方向 */}
        {connectingSource && (() => {
          const sourceNode = nodes.find(n => n.id === connectingSource);
          if (!sourceNode) return null;
          const startX = sourceNode.position.x + 180;
          const startY = sourceNode.position.y + 40;
          const path = `M ${startX} ${startY} C ${startX + 100} ${startY}, ${mousePos.x - 100} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
          return <path d={path} stroke="#60a5fa" strokeWidth="2" fill="none" strokeDasharray="4,4" />;
        })()}
        
        {/* 连线预览 - Target 方向（反向） */}
        {connectingTarget && (() => {
          const targetNode = nodes.find(n => n.id === connectingTarget);
          if (!targetNode) return null;
          const startX = targetNode.position.x;
          const startY = targetNode.position.y + 40;
          const path = `M ${startX} ${startY} C ${startX - 100} ${startY}, ${mousePos.x + 100} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
          return <path d={path} stroke="#60a5fa" strokeWidth="2" fill="none" strokeDasharray="4,4" />;
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
*/
