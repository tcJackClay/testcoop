import type { Connection, CanvasNode } from '../../stores/canvasStore';

interface ConnectionLineProps {
  connection: Connection;
  nodes: CanvasNode[];
}

export default function ConnectionLine({ connection, nodes }: ConnectionLineProps) {
  const sourceNode = nodes.find((n) => n.id === connection.sourceId);
  const targetNode = nodes.find((n) => n.id === connection.targetId);

  if (!sourceNode || !targetNode) return null;

  // Calculate positions (assuming default node width ~180px, height ~80px)
  const sourceX = sourceNode.position.x + 180;
  const sourceY = sourceNode.position.y + 40;
  const targetX = targetNode.position.x;
  const targetY = targetNode.position.y + 40;

  // Bezier curve control points
  const midX = (sourceX + targetX) / 2;
  const controlPointOffset = Math.abs(targetX - sourceX) / 2;

  const path = `M ${sourceX} ${sourceY} C ${sourceX + controlPointOffset} ${sourceY}, ${targetX - controlPointOffset} ${targetY}, ${targetX} ${targetY}`;

  return (
    <path
      d={path}
      className="connection-line"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
    />
  );
}
