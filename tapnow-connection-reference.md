# Tapnow 连线功能实现参考

## 1. 连接状态管理

```javascript
// 三个状态变量（支持双向连接）
const [connectingSource, setConnectingSource] = useState(null);      // 输出端口开始的连接
const [connectingTarget, setConnectingTarget] = useState(null);      // 输入端口开始的连接
const [connectingInputType, setConnectingInputType] = useState(null); // 'default', 'oref', 'sref'
const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
const [hoverTargetId, setHoverTargetId] = useState(null);
```

## 2. 连接建立核心逻辑 (handleNodeMouseUp)

```javascript
const handleNodeMouseUp = useCallback((targetId, e, inputType = 'default') => {
    // 从输出端口连接到输入端口（原有逻辑）
    if (connectingSource && connectingSource !== targetId) {
        // 检查是否已存在相同输入点的连接
        const exists = connections.some((c) =>
            c.from === connectingSource &&
            c.to === targetId &&
            (c.inputType || 'default') === inputType
        );
        if (!exists) {
            // 如果连接到特定输入点，先删除该输入点的旧连接
            if (inputType !== 'default') {
                setConnections((prev) => prev.filter((c) =>
                    !(c.to === targetId && (c.inputType || 'default') === inputType)
                ));
            }
            setConnections((prev) => [...prev, {
                id: `conn-${Date.now()}`,
                from: connectingSource,
                to: targetId,
                inputType: inputType !== 'default' ? inputType : undefined
            }]);
        }
    }
    // 从输入端口连接到输出端口（新功能）
    else if (connectingTarget && connectingTarget !== targetId) {
        const actualInputType = connectingInputType || inputType;
        const exists = connections.some((c) =>
            c.from === targetId &&
            c.to === connectingTarget &&
            (c.inputType || 'default') === actualInputType
        );
        if (!exists) {
            if (actualInputType !== 'default') {
                setConnections((prev) => prev.filter((c) =>
                    !(c.to === connectingTarget && (c.inputType || 'default') === actualInputType)
                ));
            }
            setConnections((prev) => [...prev, {
                id: `conn-${Date.now()}`,
                from: targetId,
                to: connectingTarget,
                inputType: actualInputType !== 'default' ? actualInputType : undefined
            }]);
        }
    }
    // 清除所有连接状态
    setConnectingSource(null);
    setConnectingTarget(null);
    setConnectingInputType(null);
    setHoverTargetId(null);
}, [connectingSource, connectingTarget, connectingInputType, connections]);
```

## 3. Target Handle（输入端口）实现

```javascript
// Target Handle - 左侧
<div
    className="input-point"
    style={{
        top: '50%',
        left: '-0.25rem',
        width: '0.5rem',
        height: '0.5rem',
        backgroundColor: isConnected ? '#60a5fa' : '#52525b',
        borderRadius: '50%',
        position: 'absolute',
        zIndex: 20,
        pointerEvents: 'auto'
    }}
    onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const world = screenToWorld(e.clientX, e.clientY);
        setMousePos(world);
        setConnectingTarget(node.id);
        setConnectingInputType('default');
    }}
    onMouseUp={(e) => handleNodeMouseUp(node.id, e, 'default')}
/>
```

## 4. Source Handle（输出端口）实现

```javascript
// Source Handle - 右侧
<div
    className="connector connector-right"
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
        setMousePos(world);
        setConnectingSource(node.id);
    }}
>
    <Plus size={10} />
</div>
```

## 5. 连线预览渲染

```javascript
// Source 开始的连线预览
{connectingSource && (() => {
    const node = nodesMap.get(connectingSource);
    if (!node) return null;
    return (
        <path
            d={`M ${node.x + node.width - 4} ${node.y + node.height / 2} 
                C ${node.x + node.width + 100} ${node.y + node.height / 2}, 
                  ${mousePos.x - 100} ${mousePos.y}, 
                  ${mousePos.x} ${mousePos.y}`}
            stroke="#60a5fa"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4,4"
        />
    );
})()}

// Target 开始的连线预览（反向）
{connectingTarget && (() => {
    const node = nodesMap.get(connectingTarget);
    if (!node) return null;
    // 从输入端口向左拖拽
    const startX = node.x + 4;
    const startY = node.y + node.height / 2;
    return (
        <path
            d={`M ${startX} ${startY} 
                C ${startX - 100} ${startY}, 
                  ${mousePos.x + 100} ${mousePos.y}, 
                  ${mousePos.x} ${mousePos.y}`}
            stroke="#60a5fa"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4,4"
        />
    );
})()}
```

## 6. 背景点击处理

```javascript
const handleBackgroundClick = (e) => {
    if (connectingSource) {
        const world = screenToWorld(e.clientX, e.clientY);
        setContextMenu({ 
            visible: true, 
            x: e.clientX, 
            y: e.clientY, 
            worldX: world.x, 
            worldY: world.y, 
            sourceNodeId: connectingSource 
        });
        setConnectingSource(null);
    } else if (connectingTarget) {
        const world = screenToWorld(e.clientX, e.clientY);
        setContextMenu({ 
            visible: true, 
            x: e.clientX, 
            y: e.clientY, 
            worldX: world.x, 
            worldY: world.y, 
            targetNodeId: connectingTarget, 
            inputType: connectingInputType 
        });
        setConnectingTarget(null);
        setConnectingInputType(null);
    }
};
```

## 7. 连接状态样式

```javascript
// 节点悬停时显示绿色边框（当可以作为连接目标时）
const isHoverTarget = hoverTargetId === node.id;
const hoverRingClass = isHoverTarget && (
    (connectingSource && connectingSource !== node.id) || 
    (connectingTarget && connectingTarget !== node.id)
) ? 'ring-2 ring-green-500/50' : '';

// Source 激活样式
const sourceActiveClass = connectingSource === node.id ? 'ring-2 ring-green-400/50' : '';
```

## 8. 关键差异总结

| 特性 | 当前实现 | Tapnow 实现 |
|------|----------|-------------|
| 连接状态数量 | 1个 | 3个 |
| 连接方向 | Source→Target | 双向 |
| 鼠标位置更新时机 | 移动时 | 按下时 |
| 连接处理函数 | 分散 | 统一(handleNodeMouseUp) |
| Target 事件 | onMouseDown + onClick | onMouseDown + onMouseUp |

## 9. 需要实现的 Hook 接口

```typescript
interface UseCanvasConnectionsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  viewPort: { x: number; y: number; zoom: number };
  nodes: CanvasNode[];
  connections: Connection[];
  addConnection: (sourceId: string, targetId: string, inputType?: string) => void;
  deleteConnection: (id: string) => void;
}

interface UseCanvasConnectionsReturn {
  // 状态
  connectingSource: string | null;
  connectingTarget: string | null;
  connectingInputType: string | null;
  mousePos: { x: number; y: number };
  hoverTargetId: string | null;
  
  // 处理器
  onSourceMouseDown: (nodeId: string, worldPos: { x: number; y: number }) => void;
  onTargetMouseDown: (nodeId: string, inputType: string, worldPos: { x: number; y: number }) => void;
  onNodeMouseUp: (nodeId: string, inputType?: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  onCancelConnection: () => void;
  
  // Canvas 事件
  onCanvasMouseMove: (worldPos: { x: number; y: number }) => void;
  onCanvasClick: (e: React.MouseEvent) => void;
  
  // 渲染
  ConnectionRenderer: () => React.ReactNode;
}
```
