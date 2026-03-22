import type { ProjectHistoryRecord } from '../../api/project'
import { getOSSUrl } from '../../api/oss'

export const getDisplayName = (record: ProjectHistoryRecord): string =>
  record.fileName || record.objectKey.split('/').filter(Boolean).pop() || record.objectKey

export const getDisplayUrl = (record: ProjectHistoryRecord): string => getOSSUrl(record.objectKey)

export const formatHistoryTime = (dateStr?: string) => {
  if (!dateStr) return ''

  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatHistorySize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
