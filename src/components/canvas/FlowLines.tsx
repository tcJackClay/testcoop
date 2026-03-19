// FlowLines.tsx - SVG 流程线组件
import { useMemo } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

interface FlowLine {
  sourceId: number;
  targetId: number;
  type: string;
  sourcePos?: { x: number; y: number };
  targetPos?: { x: number; y: number };
}

interface FlowLinesProps {
  lines?: FlowLine[];
}

export default function FlowLines({ lines = [] }: FlowLinesProps) {
  const { viewPort, nodes, connections } = useCanvasStore();

  // 使用 useMemo 计算流程线，避免无限循环
  const animatedLines = useMemo(() => {
    const allLines: FlowLine[] = [...lines];
    
    // 从普通连线上检测是否有 assetId 关联
    const nodeAssetMap = new Map<string, number>();  // nodeId -> assetId
    nodes.forEach(node => {
      if (node.data?.assetId) {
        nodeAssetMap.set(node.id, node.data.assetId as number);
      }
    });
    
    // 检查普通连线，如果两端都有 assetId，则添加为流程线
    connections.forEach(conn => {
      const sourceAssetId = nodeAssetMap.get(conn.sourceId);
      const targetAssetId = nodeAssetMap.get(conn.targetId);
      
      if (sourceAssetId && targetAssetId) {
        // 检查是否已经存在
        const exists = allLines.some(l => 
          l.sourceId === sourceAssetId && l.targetId === targetAssetId
        );
        if (!exists) {
          allLines.push({
            sourceId: sourceAssetId,
            targetId: targetAssetId,
            type: '流程'
          });
        }
      }
    });
    
    if (allLines.length === 0) {
      return [];
    }

    const nodeAssetIds = new Set(nodes.map(n => n.data?.assetId));

    return allLines
      .filter(link => nodeAssetIds.has(link.sourceId) && nodeAssetIds.has(link.targetId))
      .map(link => {
        const sourceNode = nodes.find(n => n.data?.assetId === link.sourceId);
        const targetNode = nodes.find(n => n.data?.assetId === link.targetId);

        if (sourceNode && targetNode) {
          return {
            ...link,
            sourcePos: { x: sourceNode.position.x, y: sourceNode.position.y },
            targetPos: { x: targetNode.position.x, y: targetNode.position.y }
          };
        }
        return link;
      });
  }, [lines, nodes, connections]);

  if (animatedLines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      {animatedLines.map((link, idx) => {
        if (!link.sourcePos || !link.targetPos) return null;

        // 应用 viewPort 变换
        const x1 = link.sourcePos.x * viewPort.zoom + viewPort.x + 160 * viewPort.zoom;
        const y1 = link.sourcePos.y * viewPort.zoom + viewPort.y + 100 * viewPort.zoom;
        const x2 = link.targetPos.x * viewPort.zoom + viewPort.x + 160 * viewPort.zoom;
        const y2 = link.targetPos.y * viewPort.zoom + viewPort.y + 100 * viewPort.zoom;

        const midY = (y1 + y2) / 2;
        const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

        return (
          <g key={idx}>
            <path
              d={path}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2 * viewPort.zoom}
            />
            <circle cx={x2} cy={y2} r={4 * viewPort.zoom} fill="#8b5cf6" />
            <rect
              x={(x1 + x2) / 2 - 30 * viewPort.zoom}
              y={midY - 8 * viewPort.zoom}
              width={60 * viewPort.zoom}
              height={16 * viewPort.zoom}
              rx={4 * viewPort.zoom}
              fill="#8b5cf6"
            />
            <text
              x={(x1 + x2) / 2}
              y={midY + 4 * viewPort.zoom}
              textAnchor="middle"
              fill="white"
              fontSize={10 * viewPort.zoom}
            >
              {link.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
