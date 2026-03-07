// Model Types

export type ModelProvider = 
  | 'jimeng' 
  | 'midjourney' 
  | 'flux' 
  | 'dalle' 
  | 'sora' 
  | 'veo' 
  | 'comfyui' 
  | 'custom';

export type ModelCategory = 'image' | 'video' | 'chat';

export interface ModelParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  defaultValue?: unknown;
  options?: string[];
  required?: boolean;
  description?: string;
}

export interface ModelTemplate {
  id: string;
  name: string;
  provider: ModelProvider;
  category: ModelCategory;
  parameters: ModelParameter[];
  asyncConfig?: {
    enabled: boolean;
    createEndpoint?: string;
    statusEndpoint?: string;
    resultEndpoint?: string;
    pollInterval?: number;
  };
}

export interface Model extends ModelConfig {
  providerName: string;
  category: ModelCategory;
  parameters: ModelParameter[];
  isEnabled: boolean;
  lastTestTime?: string;
}

export interface ModelTestResult {
  success: boolean;
  latency?: number;
  error?: string;
  sampleOutput?: string;
}
