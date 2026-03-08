import type { ProjectView } from '../../api/project';

export interface ProjectPanelProps {
  onBackToCanvas?: () => void;
}

// Helper functions
export const getStatusColor = (statusText?: string) => {
  return statusText === '进行中' ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400';
};

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};
