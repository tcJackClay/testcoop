# TapNow-Studio 节点连线系统参考文档

## 概述

TapNow-Studio 采用拖拽式连线方式，与我们当前实现的点击式连线不同。本文档详细分析其连线系统的实现方式。

## 核心数据结构

### 连接状态

```typescript
// 连接线数据结构
interface Connection {
  id: string;
  from: string;      // 源节点 ID
  to: string;        // 目标节点 ID
  inputType?: string; // 输入类型 (default, oref, sref, veo_start, veo_end)
}

// 连线状态管理
const [connections, setConnections] = useState([]);

// 当前连线拖拽状态
const [connectingSource, setConnectingSource] = useState(null);  // 源节点
const [connectingTarget, setConnectingTarget] = useState(null); // 目标节点
const [connectingInputType, setConnectingInputType] = useState(null); // 输入类型
const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // 鼠标位置
```

## 连接点实现

### 输入连接点 (Input Point)

位置：节点左侧

```tsx
<div
  className="input-point"
  style={{
    position: 'absolute',
    top: '50%',
    left: '-0.25rem',
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: isConnected ? '#60a5fa' : '#52525b', // 蓝色=已连接，灰色=未连接
    borderRadius: '50%',
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

### 输出连接点 (Output Point)

位置：节点右侧

```tsx
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
/>
```

### 特殊输入点 (多输入节点)

某些节点（如 image-compare, gen-video）有多个输入点：

```tsx
// image-compare 节点有两个输入点
{/* 第一个输入点 - 33% 位置 */}
<div className="input-point" style={{ top: '33%', ... }} />

{/* 第二个输入点 - 66% 位置 */}
<div className="input-point" style={{ top: '66%', ... }} />

// gen-video 节点有 veo_start 和 veo_end 输入点
{/* 首帧输入 */}
<div className="input-point" {...} onMouseDown={() => {
  setConnectingInputType('veo_start');
}} />

{/* 尾帧输入 */}
<div className="input-point" {...} onMouseDown={() => {
  setConnectingInputType('veo_end');
}} />
```

## 连线渲染 (ConnectionLine)

### SVG 绘制

```tsx
<svg className="absolute inset-0 overflow-visible w-full h-full">
  {visibleConnections.map((conn) => {
    const fromNode = nodesMap.get(conn.from);
    const toNode = nodesMap.get(conn.to);
    
    // 计算起点和终点
    const startX = fromNode.x + fromNode.width - 4;  // 源节点右侧
    const startY = fromNode.y + fromNode.height / 2;
    const endX = toNode.x + 4;  // 目标节点左侧
    const endY = toNode.y + toNode.height / 2;
    
    // 贝塞尔曲线控制点
    const dist = Math.abs(endX - startX);
    const cp1X = startX + dist * 0.5;
    const cp2X = endX - dist * 0.5;
    
    // 路径
    const path = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;
    
    return (
      <g key={conn.id} style={{ opacity: isRelatedToSelected ? 1 : 0.35 }}>
        {/* 透明粗路径 - 用于点击检测 */}
        <path
          d={path}
          stroke="transparent"
          strokeWidth="20"
          fill="none"
          style={{ pointerEvents: 'stroke' }}
        />
        {/* 外层黑线 */}
        <path d={path} stroke="#18181b" strokeWidth="4" fill="none" />
        {/* 内层灰线 */}
        <path d={path} stroke="#71717a" strokeWidth="2" fill="none" />
        {/* 端点 */}
        <circle cx={startX} cy={startY} r="2" fill="#71717a" />
        <circle cx={endX} cy={endY} r="2" fill="#71717a" />
      </g>
    );
  })}
</svg>
```

### 拖拽中的连线预览

```tsx
{connectingSource && (
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
)}
```

## 连线删除

每个连线中间有一个删除按钮：

```tsx
<g className="connection-delete" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
  {/* 大透明热区 */}
  <circle cx={midX} cy={midY} r="25" fill="transparent" />
  {/* 视觉元素 - 红色圆圈 */}
  <circle cx={midX} cy={midY} r="12" fill="#ef4444" opacity="0.8" />
  <circle cx={midX} cy={midY} r="8" fill="#ef4444" />
  {/* 图标 */}
  <Unlink size={10} className="text-white" x={midX - 5} y={midY - 5} />
</g>
```

删除函数：

```tsx
const disconnectConnection = useCallback((connectionId) => {
  setConnections(prev => prev.filter(c => c.id !== connectionId));
}, []);
```

## 特殊连接类型

### Midjourney 节点的 oref/sref 输入

```tsx
// 检查连接类型
if (toNode.type === 'gen-image' && 
    (conn.inputType === 'oref' || conn.inputType === 'sref')) {
  // 计算 oref/sref 在节点上的具体位置
  // oref 在第一个指令位置
  // sref 在第三个指令位置
}
```

## 性能优化

### 连接线虚拟化

```tsx
// 只渲染可见节点的连接线
const visibleNodeIds = useMemo(() => {
  return new Set(visibleNodes.map(n => n.id));
}, [visibleNodes]);

const visibleConnections = useMemo(() => {
  return connections.filter(conn =>
    visibleNodeIds.has(conn.from) || visibleNodeIds.has(conn.to)
  );
}, [connections, visibleNodeIds]);
```

### 使用 nodesMap 快速查找

```tsx
const nodesMap = useMemo(() => {
  return new Map(nodes.map(n => [n.id, n]));
}, [nodes]);

// O(1) 查找
const fromNode = nodesMap.get(conn.from);
const toNode = nodesMap.get(conn.to);
```

## 与当前项目的对比

| 特性 | TapNow-Studio | 当前项目 |
|------|---------------|----------|
| 连线方式 | 拖拽式 | 点击式 |
| 连接点样式 | 小圆点 (8px) | 大圆点 (20px) + 透明区域 |
| 连线预览 | 拖拽时显示虚线 | 点击后高亮节点 |
| 删除连线 | 点击中间删除按钮 | 未实现 |
| 多输入点 | 支持 | 未支持 |
| 透明度优化 | 相关节点100%，其他35% | 统一样式 |

## 实现建议

1. **切换到拖拽式连线** - 更符合用户直觉
2. **添加连线预览** - 拖拽时显示虚线
3. **添加删除功能** - 点击连线中间删除
4. **优化连接点样式** - 使用更小的圆点
5. **添加透明度效果** - 选中节点相关连线高亮
