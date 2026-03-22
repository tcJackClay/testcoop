// src/utils/canvas.ts - Canvas 工具函数
import { Position, CanvasNode, Connection } from '../stores/canvasTypes';

// 获取节点中心位置
export const getNodeCenter = (node: CanvasNode): Position => {
  const width = node.width || 200;
  const height = node.height || 100;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
};

// 计算两点之间的距离
export const getDistance = (p1: Position, p2: Position): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// 检查两个节点是否连接
export const isNodesConnected = (
  node1Id: string,
  node2Id: string,
  connections: Connection[]
): boolean => {
  return connections.some(
    conn => 
      (conn.sourceId === node1Id && conn.targetId === node2Id) ||
      (conn.sourceId === node2Id && conn.targetId === node1Id)
  );
};

// 获取节点的连接数
export const getNodeConnectionCount = (
  nodeId: string,
  connections: Connection[]
): number => {
  return connections.filter(
    conn => conn.sourceId === nodeId || conn.targetId === nodeId
  ).length;
};

// 检查节点是否可以删除（没有连接时可以删除）
export const canDeleteNode = (
  nodeId: string,
  connections: Connection[]
): boolean => {
  return getNodeConnectionCount(nodeId, connections) === 0;
};

// 生成唯一 ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
