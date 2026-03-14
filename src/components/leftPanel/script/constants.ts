// src/components/leftPanel/script/constants.ts - 脚本面板常量
export const ACTION_OPTIONS = [
  { value: 'split_episodes', label: '拆分为多集' },
  { value: 'split_scenes', label: '拆分为多场景' },
  { value: 'generate_shots', label: '生成AI分镜' },
  { value: 'transform_script', label: '转换为格式' },
];

export const RESULT_TABS = [
  { value: 'script', label: '分集脚本' },
  { value: 'storyboard', label: 'AI分镜' },
  { value: 'outline', label: '故事大纲' },
];

// 脚本格式选项
export const SCRIPT_FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plain', label: '纯文本' },
];

// 分镜风格选项
export const SHOT_STYLE_OPTIONS = [
  { value: 'cinematic', label: '电影风格' },
  { value: 'anime', label: '动漫风格' },
  { value: 'realistic', label: '写实风格' },
];
