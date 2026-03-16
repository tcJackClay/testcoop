/**
 * ImageNode Types - 类型定义
 */

export interface ImageNodeData {
  imageUrl?: string;
  assetId?: number;
  label?: string;
  prompt?: string;
  status?: string;
  aspectRatio?: string;
  resolution?: string;
  processInfo?: string;
  processFrom?: string;
  processChain?: ProcessChainItem[];
  ex2?: string;
  ext2?: string;  // 处理链信息
  assetData?: any;
  retryInfo?: RetryInfo | null;
  pendingSync?: PendingSyncInfo | null;
  error?: string;
}

export interface ProcessChainItem {
  type: string;
  targetId: number;
  targetPath: string;
  timestamp: number;
}

export interface RetryInfo {
  imageUrl: string;
  label: string;
  sourceNodeId: string;
}

export interface PendingSyncInfo {
  resourceName: string;
  resourceContent: string;
  projectId: number;
  currentAssetId: number;
}

export interface ImageNodeProps {
  nodeId: string;
  data: ImageNodeData;
  updateData: (key: string, value: unknown) => void;
  selected?: boolean;
}

export interface UpscaleOptions {
  resourceName: string;
  resourceContent: string;
  projectId: number;
  currentAssetId: number;
  sourceNodeId: string;
  label: string;
  displayImageUrl: string;
  currentEx2: ProcessChainItem[];
}

export type UpscaleMode = 'runninghub' | 'mock';
