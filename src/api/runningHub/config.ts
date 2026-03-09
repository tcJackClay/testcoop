/**
 * RunningHub Config Service
 * 配置管理服务 - localStorage 持久化
 */

import { RunningHubConfig, RunningHubFunction } from './types';
import { DEFAULT_FUNCTIONS } from './constants';

// ============================================
// Storage Key
// ============================================

const STORAGE_KEY = 'aigc-coop-runninghub-config';

// ============================================
// Config Service Class
// ============================================

class RunningHubConfigService {
  private config: RunningHubConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): RunningHubConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...{
            enabled: false,
            apiKey: '',
            baseUrl: '/api/runninghub',
            functions: DEFAULT_FUNCTIONS,
          },
          ...parsed,
          functions: parsed.functions || DEFAULT_FUNCTIONS,
        };
      }
    } catch (e) {
      console.warn('加载 RunningHub 配置失败:', e);
    }
    return {
      enabled: false,
      apiKey: '',
    baseUrl: '/api/runninghub',
      functions: DEFAULT_FUNCTIONS,
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('保存 RunningHub 配置失败:', e);
    }
  }

  getConfig(): RunningHubConfig {
    return this.config;
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  getApiKey(): string {
    return this.config.apiKey;
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.saveConfig();
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  getFunctions(): RunningHubFunction[] {
    return this.config.functions;
  }

  getFunctionById(id: string): RunningHubFunction | undefined {
    return this.config.functions.find(f => f.id === id);
  }

  getCategories(): string[] {
    const categories = new Set(this.config.functions.map(f => f.category));
    return Array.from(categories);
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }
}

// ============================================
// Export Singleton
// ============================================

export const runningHubConfig = new RunningHubConfigService();
