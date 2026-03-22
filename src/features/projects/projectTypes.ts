import type { ProjectView } from '../../api/project';

export interface ProjectPanelProps {
  onBackToCanvas?: () => void;
}

const STATUS_CLASS_MAP: Record<string, string> = {
  进行中: 'status-active',
  已完成: 'status-pending',
  已归档: 'status-archived',
  未知: 'status-unknown',
};

export const getStatusColor = (statusText?: string) =>
  STATUS_CLASS_MAP[statusText || '未知'] || STATUS_CLASS_MAP.未知;

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
};

export const getProjectSummary = (project: ProjectView) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  statusText: project.statusText,
  createTime: formatDate(project.createTime),
  updateTime: formatDate(project.updateTime),
});
