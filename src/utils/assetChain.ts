/**
 * Asset Chain Utilities - 资产流程线工具
 * 用于管理和更新资产的流程线关系
 */

import { imageApi, type Image } from '../api/image'
import { useCanvasStore } from '../stores/canvasStore'

export interface ProcessChainRecord {
  type: string        // 处理类型，如 '生成', '高清放大', '去水印'
  targetId?: number   // 结果资产ID
  prompt?: string     // 提示词（仅生成时）
  timestamp: number   // 时间戳
  targetPath?: string // 结果路径
}

/**
 * 获取节点的所有输入连接
 */
export function getInputConnections(nodeId: string): Array<{ sourceId: string; targetId: string; inputType: string }> {
  const connections = useCanvasStore.getState().connections
  return connections
    .filter(c => c.targetId === nodeId)
    .map((c) => ({ ...c, inputType: c.inputType || 'default' }))
}

/**
 * 获取节点的输入资产ID（如果有）
 * 查找连接到当前节点的源节点，如果源节点有 assetId 则返回
 */
export function getInputAssetId(nodeId: string): number | null {
  const connections = getInputConnections(nodeId)
  
  if (connections.length === 0) {
    return null
  }
  
  // 找到第一个有 assetId 的源节点
  const nodes = useCanvasStore.getState().nodes
  for (const conn of connections) {
    const sourceNode = nodes.find(n => n.id === conn.sourceId)
    if (sourceNode?.data?.assetId) {
      return sourceNode.data.assetId as number
    }
  }
  
  return null
}

/**
 * 追加记录到上游资产的 ext2
 * 参考 useUpscale.ts 的实现
 */
export async function appendToAssetChain(
  sourceAssetId: number,
  record: ProcessChainRecord
): Promise<void> {
  try {
    console.log('[assetChain] 追加记录到资产:', sourceAssetId, record)
    
    // 1. 获取源资产的最新信息
    const sourceAsset = await imageApi.getById(sourceAssetId)
    if (!sourceAsset) {
      console.error('[assetChain] 源资产不存在:', sourceAssetId)
      return
    }
    
    // 2. 解析现有的 ext2
    let sourceExt2: ProcessChainRecord[] = []
    if (sourceAsset.ext2) {
      try {
        sourceExt2 = JSON.parse(sourceAsset.ext2)
      } catch {
        sourceExt2 = []
      }
    }
    
    console.log('[assetChain] 现有 ext2:', sourceExt2)
    
    // 3. 追加新记录
    const newExt2 = [...sourceExt2, record]
    
    // 4. 更新源资产
    await imageApi.put(sourceAssetId, {
      ext2: JSON.stringify(newExt2)
    })
    
    console.log('[assetChain] ext2 更新成功:', { before: sourceExt2.length, after: newExt2.length })
  } catch (error) {
    console.error('[assetChain] 更新源资产 ext2 失败:', error)
  }
}

/**
 * 检查路径是否为临时资产
 */
export function isTempAsset(path: string): boolean {
  return path.includes('temp/')
}

/**
 * 从 assetId 获取资产路径
 */
export async function getAssetPath(assetId: number): Promise<string | null> {
  try {
    const asset = await imageApi.getById(assetId)
    return asset?.resourceContent || null
  } catch {
    return null
  }
}
