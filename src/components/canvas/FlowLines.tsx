// FlowLines.tsx - SVG 流程线组件
import { useEffect, useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

interface FlowLine {
  sourceId: number;
  targetId: number;
  type: string;
  sourcePos?: { x: number; y: number };
  targetPos?: { x: number; y: number };
}

interface FlowLinesProps {
  lines: FlowLine[];
}

export default function FlowLines({ lines }: FlowLinesProps) {
  const { viewPort, nodes } = useCanvasStore();
  const [animatedLines, setAnimatedLines] = useState<FlowLine[]>([]);

  // 监听节点变化，更新连线位置并过滤已删除的节点
  useEffect(() => {
    if (lines.length === 0) {
      setAnimatedLines([]);
      return;
    }

    const nodeAssetIds = new Set(nodes.map(n => n.data?.assetId));

    const updated = lines
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

    setAnimatedLines(updated);
  }, [lines, nodes]);

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
