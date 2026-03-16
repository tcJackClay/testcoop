// FlowLinesManager.tsx - 资产流程线管理
// 处理资产拖入时创建节点和流程线
import { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

interface FlowLine {
  sourceId: number;
  targetId: number;
  type: string;
  sourcePos?: { x: number; y: number };
  targetPos?: { x: number; y: number };
}

interface AssetInfo {
  x: number;
  y: number;
  id: number;
  name: string;
  ext2?: string;
  assetData?: any;
}

export default function FlowLinesManager({ assetInfo, onComplete }: { assetInfo: AssetInfo | null; onComplete?: () => void }) {
  const { nodes, addNode } = useCanvasStore();
  const [flowLines, setFlowLines] = useState<FlowLine[]>([]);
  const processedRef = useRef(false);
  
  // 当有资产信息时，构建流程链
  useEffect(() => {
    // 跳过无效数据或已处理过的
    if (!assetInfo || !assetInfo.ext2 || processedRef.current) {
      return;
    }
    
    console.log('[FlowLinesManager] 构建流程链, asset:', assetInfo.name);
    processedRef.current = true;

    const processChain = JSON.parse(assetInfo.ext2);
    if (processChain.length === 0) {
      processedRef.current = false;
      return;
    }

    const buildChain = async () => {
      try {
        const { imageApi } = await import('../../api/image');
        
        // assetInfo 已经包含 ext2，直接用它开始
        const edges: Array<{ sourceId: number; targetId: number; type: string }> = [];
        const visited = new Set<number>();
        const queue = [assetInfo.id];
        
        // BFS 遍历 - 从 assetInfo 开始
        while (queue.length > 0) {
          const currentId = queue.shift()!;
          if (visited.has(currentId)) continue;
          visited.add(currentId);
          
          // 优先使用 assetInfo 的 ext2（拖入时传入的）
          let currentExt2: string | null = null;
          
          if (currentId === assetInfo.id && assetInfo.ext2) {
            currentExt2 = assetInfo.ext2;
          } else {
            // 其他节点从 API 获取
            const currentAsset = await imageApi.getById(currentId);
            currentExt2 = currentAsset?.ext2 || null;
          }
          
          if (currentExt2) {
            try {
              const chain = JSON.parse(currentExt2);
              chain.forEach((record: any) => {
                // ext2 存储在源资产上，记录的是 targetId（处理结果）
                // 例如：资产A.ext2 = [{type: '高清放大', targetId: 1129}]
                // 表示 1129 是由 A 处理产生的
                if (record.targetId) {
                  // sourceId = currentId（当前遍历的资产就是源资产）
                  const sourceId = currentId;
                  const targetId = record.targetId;
                  
                  // 避免重复添加 edges
                  const exists = edges.some(e => e.sourceId === sourceId && e.targetId === targetId);
                  if (!exists) {
                    edges.push({ 
                      sourceId, 
                      targetId, 
                      type: record.type 
                    });
                  }
                  if (!visited.has(targetId)) {
                    queue.push(targetId);
                  }
                }
              });
            } catch (e) {
              console.error('[FlowLinesManager] 解析 ext2 失败:', e);
            }
          }
        }

        console.log('[FlowLinesManager] BFS 完成, edges count:', edges.length, edges);
        
        if (edges.length === 0) {
          console.log('[FlowLinesManager] 没有找到边，只创建根节点');
          // 没有子节点，只创建根节点
          const canvasStore = useCanvasStore.getState();
          canvasStore.addNode('imageNode', { x: assetInfo.x, y: assetInfo.y }, {
            data: {
              imageUrl: assetInfo.id.toString(),
              assetId: assetInfo.id,
              label: assetInfo.name,
              status: 'completed',
              processInfo: '原始图片',
              // 传递 ext2 和 assetData
              ext2: assetInfo.ext2,
              assetData: assetInfo.assetData,
            }
          });
          
          if (onComplete) {
            onComplete();
          }
          processedRef.current = false;
          return;
        }
        
        // 构建节点列表 - 使用 BFS 方式布局
        const chain: Array<{ id: number; type: string; processType: string; offsetX: number; offsetY: number }> = [];
        const processedIds = new Set<number>();
        
        // 根节点
        chain.push({ id: assetInfo.id, type: '原始图片', processType: '', offsetX: 0, offsetY: 0 });
        processedIds.add(assetInfo.id);
        
        // BFS 遍历 edges 构建节点层级
        let currentLayer = [assetInfo.id];
        let depth = 0;
        
        while (currentLayer.length > 0) {
          const nextLayer: number[] = [];
          let colIndex = 0;
          
          currentLayer.forEach(nodeId => {
            const childEdges = edges.filter(e => e.sourceId === nodeId);
            childEdges.forEach(edge => {
              if (!processedIds.has(edge.targetId)) {
                chain.push({
                  id: edge.targetId, type: edge.type, processType: edge.type,
                  offsetX: colIndex * 320, offsetY: (depth + 1) * 260
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

        console.log('[FlowLinesManager] 节点列表:', chain);

        if (chain.length <= 1) {
          console.log('[FlowLinesManager] 只有根节点，不创建额外节点');
          if (onComplete) {
            onComplete();
          }
          processedRef.current = false;
          return;
        }

        // 创建节点
        console.log('[FlowLinesManager] 创建节点, count:', chain.length);
        chain.forEach(node => {
          addNode('imageNode', { x: assetInfo.x + node.offsetX, y: assetInfo.y + node.offsetY }, {
            data: {
              imageUrl: node.id.toString(),
              assetId: node.id,
              label: node.type === '原始图片' ? assetInfo.name : `${assetInfo.name}-${node.type}`,
              status: 'completed',
              processInfo: node.type === '原始图片' ? '原始图片' : node.processType,
              // 根节点传递 ext2 和 assetData，子节点由后续处理填充
              ...(node.type === '原始图片' ? { ext2: assetInfo.ext2, assetData: assetInfo.assetData } : {}),
            }
          });
        });

        // 延迟创建连线，然后清空 assetInfo
        setTimeout(() => {
          const canvasStore = useCanvasStore.getState();
          const lines: FlowLine[] = [];
          
          edges.forEach(edge => {
            const sourceNode = canvasStore.nodes.find(n => n.data?.assetId === edge.sourceId);
            const targetNode = canvasStore.nodes.find(n => n.data?.assetId === edge.targetId);
            
            if (sourceNode && targetNode) {
              lines.push({
                sourceId: edge.sourceId, targetId: edge.targetId, type: edge.type,
                sourcePos: { x: sourceNode.position.x, y: sourceNode.position.y },
                targetPos: { x: targetNode.position.x, y: targetNode.position.y }
              });
            }
          });
          
          console.log('[FlowLinesManager] 设置流程线:', lines.length);
          setFlowLines(lines);
          
          // 通知完成，让 Canvas 清空 assetInfo
          if (onComplete) {
            onComplete();
          }
          processedRef.current = false;
        }, 500);
        
      } catch (err) {
        console.error('[FlowLinesManager] 构建失败:', err);
        processedRef.current = false;
      }
    };
    
    buildChain();
  }, [assetInfo, addNode]);

  // 监听节点变化更新连线位置
  useEffect(() => {
    if (flowLines.length === 0) return;
    
    const nodeAssetIds = new Set(nodes.map(n => n.data?.assetId));
    
    setFlowLines(prev => prev
      .filter(l => nodeAssetIds.has(l.sourceId) && nodeAssetIds.has(l.targetId))
      .map(l => {
        const sourceNode = nodes.find(n => n.data?.assetId === l.sourceId);
        const targetNode = nodes.find(n => n.data?.assetId === l.targetId);
        if (sourceNode && targetNode) {
          return {
            ...l,
            sourcePos: { x: sourceNode.position.x, y: sourceNode.position.y },
            targetPos: { x: targetNode.position.x, y: targetNode.position.y }
          };
        }
        return l;
      })
    );
  }, [nodes, flowLines.length]);
  
  if (flowLines.length === 0) return null;

  // 节点尺寸
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 120;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {flowLines.map((link, idx) => {
        if (!link.sourcePos || !link.targetPos) return null;
        
        // 直接使用世界坐标（SVG 已在 canvas-content 内，已应用 viewport 变换）
        const x1 = link.sourcePos.x + NODE_WIDTH / 2;
        const y1 = link.sourcePos.y + NODE_HEIGHT / 2;
        const x2 = link.targetPos.x + NODE_WIDTH / 2;
        const y2 = link.targetPos.y + NODE_HEIGHT / 2;
        const midY = (y1 + y2) / 2;
        const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
        
        return (
          <g key={idx}>
            <path d={path} fill="none" stroke="#8b5cf6" strokeWidth={2} />
            <circle cx={x2} cy={y2} r={4} fill="#8b5cf6" />
            <rect x={(x1 + x2) / 2 - 30} y={midY - 8}
              width={60} height={16} rx={4} fill="#8b5cf6" />
            <text x={(x1 + x2) / 2} y={midY + 4} textAnchor="middle" fill="white" fontSize={10}>
              {link.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
