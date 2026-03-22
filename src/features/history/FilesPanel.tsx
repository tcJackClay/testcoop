import { useEffect, useMemo, useState } from 'react'
import { Grid3X3, Grip, Image, Layout, List, Loader2, Video, X } from 'lucide-react'
import { projectApi, type ProjectHistoryRecord } from '../../api/project'
import { useProjectStore } from '../../stores/projectStore'
import { formatHistorySize, formatHistoryTime, getDisplayName, getDisplayUrl } from './historyUtils'

type ViewMode = 'grid' | 'list'
type MediaType = 'image' | 'video'

export default function FilesPanel({ onClose }: { onClose: () => void }) {
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [files, setFiles] = useState<ProjectHistoryRecord[]>([])
  const [loading, setLoading] = useState(false)

  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id

  useEffect(() => {
    const loadFiles = async () => {
      if (!projectId) {
        setFiles([])
        return
      }

      setLoading(true)
      try {
        const data = await projectApi.getHistory(projectId, { pageSize: 100 })
        setFiles(data.filter((item) => item.historyStatus !== 'deleted'))
      } catch (error) {
        console.error('load files failed:', error)
        setFiles([])
      } finally {
        setLoading(false)
      }
    }

    void loadFiles()
  }, [projectId])

  const visibleFiles = useMemo(
    () => files.filter((file) => file.mediaType === mediaType),
    [files, mediaType]
  )

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
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border-soft)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-meta">Side Library</p>
            <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">文件面板</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">当前项目的可拖拽图片与视频结果。</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white/5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-2xl border border-[var(--border-soft)] bg-white/5 p-1">
            <button
              onClick={() => setMediaType('image')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                mediaType === 'image'
                  ? 'bg-primary-500 text-white shadow-brand'
                  : 'text-[var(--text-secondary)] hover:bg-white/6 hover:text-[var(--text-primary)]'
              }`}
              title="图片"
            >
              <Image size={14} />
              图片
            </button>
            <button
              onClick={() => setMediaType('video')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                mediaType === 'video'
                  ? 'bg-primary-500 text-white shadow-brand'
                  : 'text-[var(--text-secondary)] hover:bg-white/6 hover:text-[var(--text-primary)]'
              }`}
              title="视频"
            >
              <Video size={14} />
              视频
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[var(--border-soft)] px-3 py-1 text-xs text-[var(--text-secondary)]">
              {visibleFiles.length} 项
            </span>
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
                <Grid3X3 size={15} />
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
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
          </div>
        ) : !projectId || visibleFiles.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/5 px-6 py-8 text-center shadow-soft">
              {mediaType === 'image' ? (
                <Image className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
              ) : (
                <Video className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
              )}
              <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">暂无{mediaType === 'image' ? '图片' : '视频'}结果</p>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">生成后即可从这里直接拖入画布。</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {visibleFiles.map((file) => {
              const displayUrl = getDisplayUrl(file)
              return (
                <div
                  key={file.id}
                  className="group overflow-hidden rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-2)] shadow-soft transition hover:-translate-y-0.5 hover:border-primary-500/30"
                  onMouseEnter={() => setHoveredItem(file.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  draggable
                  onDragStart={(event) => handleDragStart(event, file)}
                >
                  <div className="relative aspect-square overflow-hidden bg-[var(--surface-3)]">
                    {file.mediaType === 'image' ? (
                      <img src={displayUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <video src={displayUrl} className="h-full w-full object-cover" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    {hoveredItem === file.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/28">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-xs text-white">
                          <Grip size={12} />
                          拖入画布
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-black/35 px-2 py-1 text-[10px] text-white/85">
                      {formatHistoryTime(file.createdTime)}
                    </div>
                  </div>

                  <div className="px-3 py-3">
                    <p className="truncate text-xs font-medium text-[var(--text-primary)]">{getDisplayName(file)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleFiles.map((file) => {
              const displayUrl = getDisplayUrl(file)
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-3 shadow-soft transition hover:border-primary-500/25 hover:bg-[var(--surface-3)]"
                  onMouseEnter={() => setHoveredItem(file.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  draggable
                  onDragStart={(event) => handleDragStart(event, file)}
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-3)]">
                    {file.mediaType === 'image' ? (
                      <img src={displayUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <video src={displayUrl} className="h-full w-full object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{getDisplayName(file)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {formatHistoryTime(file.createdTime)}
                      {file.fileSize ? ` · ${formatHistorySize(file.fileSize)}` : ''}
                    </p>
                  </div>

                  {hoveredItem === file.id && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                      <Layout size={14} />
                      拖入画布
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
