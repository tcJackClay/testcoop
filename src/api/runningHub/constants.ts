/**
 * RunningHub Constants
 * 默认功能配置 - webAppID 备用
 */

import { RunningHubFunction } from './types';

// ============================================
// Default Functions
// ============================================

export const DEFAULT_FUNCTIONS: RunningHubFunction[] = [
  {
    id: 'ai_image_upscale',
    name: '图片放大',
    icon: '⬆️',
    color: '#3B82F6',
    webappId: '2007596875607707650', // 图片放大
    category: '图片处理',
    description: '限制：4080最长边',
  },
  {
    id: 'image_enhance',
    name: '人物多角度',
    icon: '🖼️',
    color: '#10B981',
    webappId: '1997953926043459586', // 人物多角度
    category: '图片处理',
    description: '1：上传主角图片；2：提示词输入；3：点击运行',
  },
  {
    id: 'style_transfer',
    name: '图片融合',
    icon: '🎭',
    color: '#8B5CF6',
    webappId: '1954402676572340225', // 图片融合
    category: '图片处理',
    description: '拼好的图片融入到场景中',
  },
  {
    id: 'video_editing',
    name: '镜头分镜',
    icon: '🎬',
    color: '#EC4899',
    webappId: '2004018172321800193', // 镜头分镜
    category: '图片处理',
    description: '上传图片即可出分镜',
  },
  {
    id: 'text_analysis',
    name: '道具迁移',
    icon: '📝',
    color: '#6B7280',
    webappId: '1973744628144975874', // 道具迁移
    category: '图片处理',
    description: '图片1目标图，图片2放入的道具',
  },
  {
    id: 'data_visualization',
    name: '动作迁移',
    icon: '📊',
    color: '#059669',
    webappId: '1996522834732130305', // 动作迁移
    category: '视频处理',
    description: '图片与视频比例一致，5-60s',
  },
  {
    id: 'video_upscale',
    name: '视频高清',
    icon: '📈',
    color: '#059669',
    webappId: '1933689617772404738', // 视频高清
    category: '视频处理',
    description: '视频高清放大+补帧',
  },
];
