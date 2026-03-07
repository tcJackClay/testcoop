// History Types

export type HistoryItemType = 'image' | 'video';
export type HistoryItemStatus = 'pending' | 'success' | 'failed';

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  status: HistoryItemStatus;
  modelName: string;
  modelId: number;
  prompt?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  params?: Record<string, unknown>;
  error?: string;
  duration?: number;
  createTime: string;
  finishTime?: string;
}

export interface HistoryQuery {
  page: number;
  pageSize: number;
  type?: HistoryItemType;
  status?: HistoryItemStatus;
  modelId?: number;
  startDate?: string;
  endDate?: string;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface HistoryBatchDownloadRequest {
  itemIds: string[];
  format: 'zip' | 'folder';
}

export interface HistoryRebuildRequest {
  itemIds: string[];
  forceRebuild?: boolean;
}
