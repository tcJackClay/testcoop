// FlowLinesByAssetId.tsx - 资产流程线管理组件
// 处理资产拖入时创建节点和流程线
import { useEffect } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

interface ChainNode {
  id: number;
  type: string;
  processType: string;
  offsetX: number;
  offsetY: number;
}

interface FlowLinesByAssetIdProps {
  x: number;
  y: number;
  asset: {
    id: number;
    name: string;
    ext2?: string;
  };
}

export default function FlowLinesByAssetId({ x, y, asset }: FlowLinesByAssetIdProps) {
  const { nodes, addNode } = useCanvasStore();

  useEffect(() => {
    const processChain = asset.ext2 ? JSON.parse(asset.ext2) : [];
    
    if (processChain.length === 0) return;

    // 异步获取所有资产构建边关系
    const buildChain = async () => {
      try {
        const { imageApi } = await import('../../api/image');
        const allImages = await imageApi.getAll(1024);
        
        // 构建边关系
        const edges: Array<{ sourceId: number; targetId: number; type: string }> = [];
        
        // BFS 遍历
        const queue = [asset.id];
        const visited = new Set<number>([asset.id]);
        
        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const currentAsset = allImages.find((img: any) => img.id === currentId);
          
          if (currentAsset?.ext2) {
            const currentChain = JSON.parse(currentAsset.ext2);
            currentChain.forEach((record: any) => {
              if (record.sourceId === currentId) {
                edges.push({
                  sourceId: record.sourceId,
                  targetId: record.targetId,
                  type: record.type
                });
                if (!visited.has(record.targetId)) {
                  visited.add(record.targetId);
                  queue.push(record.targetId);
                }
              }
            });
          }
        }
        
        // 构建节点位置
        const chain: ChainNode[] = [];
        const processedIds = new Set<number>();
        
        chain.push({ id: asset.id, type: '原始图片', processType: '', offsetX: 0, offsetY: 0 });
        processedIds.add(asset.id);
        
        // BFS 布局
        let currentLayer = [asset.id];
        let depth = 0;
        
        while (currentLayer.length > 0) {
          const nextLayer: number[] = [];
          let colIndex = 0;
          
          currentLayer.forEach(nodeId => {
            const childEdges = edges.filter(e => e.sourceId === nodeId);
            childEdges.forEach(edge => {
              if (!processedIds.has(edge.targetId)) {
                chain.push({
                  id: edge.targetId,
                  type: edge.type,
                  processType: edge.type,
                  offsetX: colIndex * 320,
                  offsetY: (depth + 1) * 260
                });
                processedIds.add(edge.targetId);
                nextLayer.push(edge.targetId);
                colIndex++;
              }
            });
          });
          
          currentLayer = nextLayer;
          depth++;
        }
        
        // 创建节点
        const createdNodes: Array<{ assetId: number; nodeId: string }> = [];
        
        chain.forEach(node => {
          const nodeX = x + node.offsetX;
          const nodeY = y + node.offsetY;
          
          const nodeId = addNode('imageNode', { x: nodeX, y: nodeY }, {
            data: {
              imageUrl: node.id.toString(),
              assetId: node.id,
              label: node.type === '原始图片' ? asset.name : `${asset.name}-${node.type}`,
              status: 'completed',
              processInfo: node.type === '原始图片' ? '原始图片' : node.processType,
            }
          });
          
          createdNodes.push({ assetId: node.id, nodeId });
        });
        
        // 创建流程线数据
        const flowLines: Array<{
          sourceId: number;
          targetId: number;
          type: string;
          sourcePos?: { x: number; y: number };
          targetPos?: { x: number; y: number };
        }> = [];
        
        // 延迟获取节点位置创建连线
        setTimeout(() => {
          const canvasStore = useCanvasStore.getState();
          
          edges.forEach(edge => {
            const sourceNode = canvasStore.nodes.find(n => n.data?.assetId === edge.sourceId);
            const targetNode = canvasStore.nodes.find(n => n.data?.assetId === edge.targetId);
            
            if (sourceNode && targetNode) {
              flowLines.push({
                sourceId: edge.sourceId,
                targetId: edge.targetId,
                type: edge.type,
                sourcePos: { x: sourceNode.position.x, y: sourceNode.position.y },
                targetPos: { x: targetNode.position.x, y: targetNode.position.y }
              });
            }
          });
          
          // 保存到 store 或通过事件触发
          window.dispatchEvent(new CustomEvent('flowlines-update', { detail: flowLines }));
        }, 500);
        
      } catch (err) {
        console.error('[FlowLinesByAssetId] 构建链条失败:', err);
      }
    };
    
    buildChain();
  }, [asset.id, asset.ext2, x, y, asset.name, addNode]);

  return null;
}
