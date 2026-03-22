/**
 * RunningHub Types
 * 所有类型定义
 */
// ============================================
// Config Types
// ============================================

export interface RunningHubConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  functions: RunningHubFunction[];
}

export interface RunningHubFunction {
  id: string;
  name: string;
  icon: string;
  color: string;
  webappId: string;
  category: string;
  description: string;
  inputFields?: RunningHubInputField[];
  parameters?: Record<string, any>;
}

export interface RunningHubInputField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'select' | 'number' | 'checkbox';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
  description?: string;
}

// ============================================
// Node Types
// ============================================

export interface RunningHubNodeData {
  label: string;
  type: 'runninghub';
  function?: RunningHubFunction;
  inputs: Record<string, any>;
  status: 'idle' | 'configuring' | 'pending' | 'processing' | 'completed' | 'failed';
  result?: RunningHubResult;
  error?: string;
  taskId?: string;
  progress?: number;
  nodeInfoList?: RHNodeField[];
  covers?: RHCover[];
  // 回调
  onDelete?: (id: string) => void;
  onEdit?: (id: string, data: Partial<RunningHubNodeData>) => void;
  onExecute?: (id: string) => void;
  onCancel?: (id: string) => void;
  onGenerateImage?: (url: string) => void;
}

export interface RunningHubResult {
  success?: boolean;
  images?: string[];
  video?: string;
  files?: { name: string; url: string }[];
  metadata?: Record<string, any>;
  error?: string;
}

// ============================================
// Task Types
// ============================================

export interface TaskStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: RunningHubResult;
  estimatedTime?: number;
  error?: string;
}

// ============================================
// Node Info Types
// ============================================

export interface RHNodeField {
  nodeId: string;
  nodeName: string;
  description: string;
  descriptionEn?: string;
  fieldName: string;
  fieldType: 'STRING' | 'TEXT' | 'LIST' | 'IMAGE' | 'AUDIO' | 'VIDEO';
  fieldValue?: any;
  fieldData?: string; // LIST 类型的选项 JSON
}

export interface RHCover {
  coverId: string;
  coverUrl: string;
  thumbnailUri?: string;
  name?: string;
}
