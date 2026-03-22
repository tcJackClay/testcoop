import { useEffect, useMemo, useState } from 'react'
import { Check, FolderOpen, Grid3X3, Grip, Image, Layout, List, Loader2, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { projectApi, type ProjectHistoryRecord } from '../../api/project'
import { useProjectStore } from '../../stores/projectStore'
import { formatHistorySize, formatHistoryTime, getDisplayName, getDisplayUrl } from './historyUtils'

type ViewMode = 'grid' | 'list'
type MediaType = 'image' | 'video'

const statusTextMap: Record<ProjectHistoryRecord['historyStatus'], string> = {
  generated: '已生成',
  saved: '已入库',
  deleted: '已删除',
  missing: '资源缺失',
  failed: '生成失败',
}

const statusClassMap: Record<ProjectHistoryRecord['historyStatus'], string> = {
  generated: 'status-pending',
  saved: 'status-active',
  deleted: 'status-archived',
  missing: 'status-unknown',
  failed: 'status-unknown',
}

export default function GenerationHistory() {
  const { t } = useTranslation()
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [history, setHistory] = useState<ProjectHistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id

  useEffect(() => {
    const loadHistory = async () => {
      if (!projectId) {
        setHistory([])
        return
      }

      setLoading(true)
      try {
        const data = await projectApi.getHistory(projectId, { pageSize: 100 })
        setHistory(data)
      } catch (error) {
        console.error('load history failed:', error)
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    void loadHistory()
  }, [projectId])

  useEffect(() => {
    setSelectedItems(new Set())
  }, [mediaType, projectId])

  const files = useMemo(
    () =>
      history.filter(
        (item) => item.mediaType === mediaType && item.historyStatus !== 'deleted'
      ),
    [history, mediaType]
  )

  const toggleSelect = (id: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === files.length) {
      setSelectedItems(new Set())
      return
    }
    setSelectedItems(new Set(files.map((file) => file.id)))
  }

  const handleDragStart = (event: React.DragEvent, file: ProjectHistoryRecord) => {
    const imageUrl = getDisplayUrl(file)
    const displayName = getDisplayName(file)
    const dragData = {
      id: String(file.id),
      historyId: file.id,
      name: displayName,
      resourceName: displayName,
      imageUrl,
      type: file.mediaType,
      url: imageUrl,
      objectKey: file.objectKey,
      isHistoryFile: true,
    }

    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="app-page !p-0 h-full overflow-hidden">
      <div className="app-shell h-full max-w-none overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-1)]">
          <div className="border-b border-[var(--border-soft)] px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="app-meta">Project History</p>
                <h2 className="app-page-title !text-[28px]">生成历史</h2>
                <p className="app-muted mt-2">按项目查看图片和视频结果，支持选择、拖拽和回溯最近生成内容。</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-2xl border border-[var(--border-soft)] bg-white/5 p-1">
                  <button
                    onClick={() => setMediaType('image')}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                      mediaType === 'image'
                        ? 'bg-primary-500 text-white shadow-brand'
                        : 'text-[var(--text-secondary)] hover:bg-white/6 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Image size={14} />
                    {t('history.image')}
                  </button>
                  <button
                    onClick={() => setMediaType('video')}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                      mediaType === 'video'
                        ? 'bg-primary-500 text-white shadow-brand'
                        : 'text-[var(--text-secondary)] hover:bg-white/6 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Video size={14} />
                    {t('history.video')}
                  </button>
                </div>

                <div className="rounded-2xl border border-[var(--border-soft)] bg-white/5 px-3 py-2 text-sm text-[var(--text-secondary)]">
                  共 {files.length} 条
                </div>

                <div className="flex items-center rounded-2xl border border-[var(--border-soft)] bg-white/5 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      viewMode === 'grid'
                        ? 'bg-white/10 text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-white/6 hover:text-[var(--text-primary)]'
                    }`}
                    title="网格视图"
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      viewMode === 'list'
                        ? 'bg-white/10 text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-white/6 hover:text-[var(--text-primary)]'
                    }`}
                    title="列表视图"
                  >
                    <List size={16} />
                  </button>
                </div>

                {files.length > 0 && (
                  <button onClick={toggleSelectAll} className="btn btn-secondary text-sm">
                    <Check size={14} />
                    <span>{selectedItems.size === files.length ? '取消全选' : '全选当前结果'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : !projectId || files.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-[28px] border border-[var(--border-soft)] bg-white/5 px-10 py-10 text-center shadow-soft">
                  <FolderOpen className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
                  <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">{t('history.empty')}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    选择项目后，这里会展示当前项目的图片和视频生成结果。
                  </p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {files.map((file) => {
                  const displayUrl = getDisplayUrl(file)
                  const selected = selectedItems.has(file.id)
                  return (
                    <button
                      key={file.id}
                      type="button"
                      className={`group overflow-hidden rounded-[24px] border bg-[var(--surface-2)] text-left shadow-soft transition ${
                        selected
                          ? 'border-primary-500/50 ring-2 ring-primary-500/30'
                          : 'border-[var(--border-soft)] hover:-translate-y-0.5 hover:border-primary-500/30'
                      }`}
                      onClick={() => toggleSelect(file.id)}
                      draggable
                      onDragStart={(event) => handleDragStart(event, file)}
                    >
                      <div className="relative aspect-square overflow-hidden bg-[var(--surface-3)]">
                        {file.mediaType === 'image' ? (
                          <img src={displayUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                        ) : (
                          <video src={displayUrl} className="h-full w-full object-cover" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          {selected && (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow-brand">
                              <Check size={14} />
                            </span>
                          )}
                          <span className={`status-pill ${statusClassMap[file.historyStatus]}`}>
                            {statusTextMap[file.historyStatus]}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/82">
                          <span>{formatHistoryTime(file.createdTime)}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                            <Grip size={12} />
                            拖入画布
                          </span>
                        </div>
                      </div>

                      <div className="px-4 py-4">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{getDisplayName(file)}</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {file.fileSize ? formatHistorySize(file.fileSize) : '未记录大小'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => {
                  const displayUrl = getDisplayUrl(file)
                  const selected = selectedItems.has(file.id)
                  return (
                    <button
                      key={file.id}
                      type="button"
                      className={`flex w-full items-center gap-4 rounded-[22px] border px-4 py-4 text-left shadow-soft transition ${
                        selected
                          ? 'border-primary-500/45 bg-primary-500/10 ring-1 ring-primary-500/25'
                          : 'border-[var(--border-soft)] bg-[var(--surface-2)] hover:border-primary-500/25 hover:bg-[var(--surface-3)]'
                      }`}
                      onClick={() => toggleSelect(file.id)}
                      draggable
                      onDragStart={(event) => handleDragStart(event, file)}
                    >
                      <div className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-primary-500 bg-primary-500 text-white' : 'border-[var(--border-soft)] text-transparent'}`}>
                        <Check size={13} />
                      </div>

                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-3)]">
                        {file.mediaType === 'image' ? (
                          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <video src={displayUrl} className="h-full w-full object-cover" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{getDisplayName(file)}</p>
                          <span className={`status-pill ${statusClassMap[file.historyStatus]}`}>{statusTextMap[file.historyStatus]}</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {formatHistoryTime(file.createdTime)}
                          {file.fileSize ? ` · ${formatHistorySize(file.fileSize)}` : ''}
                        </p>
                      </div>

                      <div className="hidden items-center gap-2 rounded-full border border-[var(--border-soft)] px-3 py-1.5 text-xs text-[var(--text-secondary)] lg:flex">
                        <Layout size={14} />
                        拖入画布
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
