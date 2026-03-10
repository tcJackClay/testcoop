import type { Connection, CanvasNode } from '../../stores/canvasStore';
import { X } from 'lucide-react';

interface ConnectionLineProps {
  connection: Connection;
  nodes: CanvasNode[];
  selectedNodeId?: string;
  onDeleteConnection?: (connectionId: string) => void;
}

export default function ConnectionLine({ 
  connection, 
  nodes, 
  selectedNodeId,
  onDeleteConnection 
}: ConnectionLineProps) {
  const sourceNode = nodes.find((n) => n.id === connection.sourceId);
  const targetNode = nodes.find((n) => n.id === connection.targetId);

  if (!sourceNode || !targetNode) return null;

  // 检查连接线是否与选中节点相关
  const isRelatedToSelected = selectedNodeId && (
    sourceNode.id === selectedNodeId ||
    targetNode.id === selectedNodeId
  );
  
  // 设置透明度：选中节点相关为100%，其他为35%
  const opacity = isRelatedToSelected ? 1 : 0.35;

  // Calculate positions (assuming default node width ~180px, height ~80px)
  const sourceX = sourceNode.position.x + 180;
  const sourceY = sourceNode.position.y + 40;
  const targetX = targetNode.position.x;
  const targetY = targetNode.position.y + 40;

  // Bezier curve control points
  const dist = Math.abs(targetX - sourceX);
  const cp1X = sourceX + dist * 0.5;
  const cp2X = targetX - dist * 0.5;

  const path = `M ${sourceX} ${sourceY} C ${cp1X} ${sourceY}, ${cp2X} ${targetY}, ${targetX} ${targetY}`;
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteConnection?.(connection.id);
  };

  return (
    <g style={{ opacity }} className="connection-group">
      {/* 透明路径用于点击检测连接线 */}
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
      <circle cx={sourceX} cy={sourceY} r="2" fill="#71717a" />
      <circle cx={targetX} cy={targetY} r="2" fill="#71717a" />
      
      {/* 删除按钮 - 选中节点相关时显示 */}
      {isRelatedToSelected && onDeleteConnection && (
        <g
          className="connection-delete cursor-pointer"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={handleDelete}
          onMouseDown={handleDelete}
        >
          {/* 大的透明点击热区 */}
          <circle cx={midX} cy={midY} r="25" fill="transparent" />
          {/* 视觉元素 - 红色圆圈 */}
          <circle cx={midX} cy={midY} r="12" fill="#ef4444" opacity="0.8" style={{ pointerEvents: 'none' }} />
          <circle cx={midX} cy={midY} r="8" fill="#ef4444" style={{ pointerEvents: 'none' }} />
          <X size={10} className="text-white" x={midX - 5} y={midY - 5} style={{ pointerEvents: 'none', position: 'absolute' }} />
        </g>
      )}
    </g>
  );
}
