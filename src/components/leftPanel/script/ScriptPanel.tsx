import { useEffect } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Network,
  Package,
  ScrollText,
  Sparkles,
  Upload,
  Users,
  Wand2,
  ListOrdered,
  X,
} from 'lucide-react';
import { useScriptPanel } from './hooks';

interface ScriptPanelProps {
  onClose?: () => void;
}

const actionOptions = [
  { key: 'extractAssets', label: '提取资产', icon: Package, desc: '抽取角色、场景和道具资产' },
  { key: 'analyzeScript', label: '剧本分析', icon: Wand2, desc: '生成人物小传、关系和剧情大纲' },
  { key: 'splitEpisodes', label: '智能分集', icon: ListOrdered, desc: '按内容结构拆分剧集与脚本' },
] as const;

const resultTabs = [
  { key: 'assets', label: '资产', icon: Package },
  { key: 'bios', label: '人物', icon: Users },
  { key: 'relationships', label: '关系', icon: Network },
  { key: 'outline', label: '大纲', icon: BookOpen },
  { key: 'script', label: '剧本', icon: ScrollText },
] as const;

const sectionClassName = 'rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-2)] shadow-soft';

export default function ScriptPanel({ onClose }: ScriptPanelProps) {
  const {
    episodes,
    currentEpisode,
    localSelectedEpisodeId,
    setLocalSelectedEpisodeId,
    scriptFile,
    isAnalyzing,
    analysisProgress,
    currentAnalysisStep,
    analysisError,
    selectedAction,
    setSelectedAction,
    activeResultTab,
    setActiveResultTab,
    showActionDropdown,
    setShowActionDropdown,
    analysisResult,
    backendAssets,
    loadEpisodeScript,
    handleFileUpload,
    handleAnalyze,
  } = useScriptPanel({ onClose });

  useEffect(() => {
    if (localSelectedEpisodeId) {
      void loadEpisodeScript(parseInt(localSelectedEpisodeId, 10));
    }
  }, [localSelectedEpisodeId, loadEpisodeScript]);

  const selectedOption = actionOptions.find((option) => option.key === selectedAction) || actionOptions[0];

  const renderAssets = () => {
    const source = backendAssets;
    if (!source) {
      return (
        <div className="flex h-full items-center justify-center px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
          上传剧本并执行“提取资产”后，这里会展示角色、场景和道具结果。
        </div>
      );
    }

    const groups = [
      { title: '角色', items: source.characters || [] },
      { title: '场景', items: source.scenes || [] },
      { title: '道具', items: source.props || [] },
    ].filter((group) => group.items.length > 0);

    if (groups.length === 0) {
      return (
        <div className="flex h-full items-center justify-center px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
          当前分析结果中没有可展示的资产条目。
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.title} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">{group.title}</h4>
              <span className="text-xs text-[var(--text-tertiary)]">{group.items.length} 项</span>
            </div>
            <div className="space-y-2">
              {group.items.map((item: any, index: number) => (
                <div key={`${group.title}-${index}`} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-3">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.name}</div>
                  {item.description && <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{item.description}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderBios = () => {
    const bios = analysisResult?.characterBios || [];
    if (bios.length === 0) {
      return <EmptyState text="执行“剧本分析”后，这里会展示人物小传和角色定位。" />;
    }

    return (
      <div className="space-y-3">
        {bios.map((bio, index) => (
          <div key={`${bio.name}-${index}`} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">{bio.name}</h4>
              {bio.role && <span className="status-pill status-pending">{bio.role}</span>}
            </div>
            <div className="mt-2 space-y-1 text-xs leading-5 text-[var(--text-secondary)]">
              {bio.age && <p>年龄：{bio.age}</p>}
              {bio.background && <p>{bio.background}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRelationships = () => {
    const relationships = analysisResult?.relationships || [];
    if (relationships.length === 0) {
      return <EmptyState text="执行“剧本分析”后，这里会展示人物关系和关系说明。" />;
    }

    return (
      <div className="space-y-3">
        {relationships.map((relationship, index) => (
          <div key={`${relationship.from}-${relationship.to}-${index}`} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-[var(--text-primary)]">{relationship.from}</span>
              <span className="text-[var(--text-tertiary)]">→</span>
              <span className="status-pill status-active">{relationship.type}</span>
              <span className="font-semibold text-[var(--text-primary)]">{relationship.to}</span>
            </div>
            {relationship.description && (
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{relationship.description}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderOutline = () => {
    const outline = analysisResult?.storyOutline;
    if (!outline) {
      return <EmptyState text="执行“剧本分析”后，这里会生成故事概要和章节结构。" />;
    }

    return (
      <div className="space-y-4">
        {(outline.title || outline.genre) && (
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-4">
            {outline.title && <h4 className="text-base font-semibold text-[var(--text-primary)]">{outline.title}</h4>}
            {outline.genre && <p className="mt-2 text-xs text-[var(--text-secondary)]">类型：{outline.genre}</p>}
          </div>
        )}

        {outline.summary && (
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">故事摘要</h4>
            <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">{outline.summary}</p>
          </div>
        )}

        {outline.chapters && outline.chapters.length > 0 && (
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">章节结构</h4>
            <div className="mt-3 space-y-2">
              {outline.chapters.map((chapter, index) => (
                <div key={`${chapter}-${index}`} className="rounded-xl border border-[var(--border-soft)] bg-white/5 px-3 py-2 text-xs text-[var(--text-secondary)]">
                  {index + 1}. {chapter}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScript = () => {
    if (episodes.length === 0) {
      return <EmptyState text="上传剧本后执行“智能分集”，这里会展示分集结果和脚本内容。" />;
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">分集列表</h4>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">共 {episodes.length} 集，选择后可查看当前剧集内容。</p>
            </div>
          </div>
          <select
            value={localSelectedEpisodeId || ''}
            onChange={(event) => setLocalSelectedEpisodeId(event.target.value)}
            className="field-select mt-3"
          >
            {episodes.map((episode) => (
              <option key={episode.id} value={episode.id}>
                {episode.name || `第 ${episode.episodeNumber || episode.id} 集`}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">当前剧本</h4>
            <span className="text-xs text-[var(--text-tertiary)]">{currentEpisode?.content?.length || 0} 字</span>
          </div>
          <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-2xl border border-[var(--border-soft)] bg-[color:rgba(11,13,18,0.52)] px-4 py-4 text-xs leading-6 text-[var(--text-secondary)]">
            {currentEpisode?.content || '暂无内容'}
          </pre>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeResultTab) {
      case 'assets':
        return renderAssets();
      case 'bios':
        return renderBios();
      case 'relationships':
        return renderRelationships();
      case 'outline':
        return renderOutline();
      case 'script':
        return renderScript();
      default:
        return <EmptyState text="暂无可展示内容。" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border-soft)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-meta">Script Workspace</p>
            <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">剧本管理</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">上传原始剧本，提取资产、分析人物关系，或按内容结构智能分集。</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white/5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          <section className={`${sectionClassName} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">剧本输入</h4>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">支持上传 `txt`、`md`、`json` 文件，作为当前分析输入。</p>
              </div>
              {scriptFile && <span className="status-pill status-active">已上传</span>}
            </div>

            <div className="mt-4 space-y-3">
              <label
                htmlFor="script-upload-panel"
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-4 transition ${
                  scriptFile
                    ? 'border-primary-500/35 bg-primary-500/10'
                    : 'border-[var(--border-soft)] bg-[var(--surface-3)] hover:border-primary-500/30'
                }`}
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${scriptFile ? 'bg-primary-500 text-white' : 'bg-white/5 text-[var(--text-secondary)]'}`}>
                  <Upload size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--text-primary)]">
                    {scriptFile ? scriptFile.name : '上传剧本文件'}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">
                    {scriptFile ? '已选择文件，随时可以重新上传替换。' : '点击选择文件，作为后续资产提取与剧本分析输入。'}
                  </span>
                </span>
              </label>
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="script-upload-panel"
              />

              <div className="relative">
                <button
                  onClick={() => setShowActionDropdown(!showActionDropdown)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-3 text-left transition hover:border-primary-500/25"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-[var(--text-secondary)]">
                    <selectedOption.icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--text-primary)]">{selectedOption.label}</span>
                    <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{selectedOption.desc}</span>
                  </span>
                  <ChevronDown size={16} className={`text-[var(--text-tertiary)] transition-transform ${showActionDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showActionDropdown && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] shadow-2xl">
                    {actionOptions.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSelectedAction(option.key as any);
                          setShowActionDropdown(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                      >
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${selectedAction === option.key ? 'bg-primary-500 text-white' : 'bg-white/5 text-[var(--text-secondary)]'}`}>
                          <option.icon size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm ${selectedAction === option.key ? 'text-primary-300' : 'text-[var(--text-primary)]'}`}>{option.label}</span>
                          <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{option.desc}</span>
                        </span>
                        {selectedAction === option.key && <Check size={14} className="text-primary-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => void handleAnalyze()}
                disabled={!scriptFile || isAnalyzing}
                className="btn btn-primary h-11 w-full justify-center text-sm disabled:opacity-50"
              >
                <Sparkles size={15} className={isAnalyzing ? 'animate-pulse' : ''} />
                <span>
                  {isAnalyzing
                    ? `${analysisProgress}%`
                    : selectedAction === 'splitEpisodes'
                      ? '开始分集'
                      : '开始处理'}
                </span>
              </button>
            </div>
          </section>

          {(isAnalyzing || analysisError) && (
            <section className={`${sectionClassName} p-4`}>
              {isAnalyzing && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">处理中</p>
                    <span className="text-xs text-[var(--text-secondary)]">{analysisProgress}%</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">{currentAnalysisStep || '正在处理剧本内容...'}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {analysisError && (
                <div className={`${isAnalyzing ? 'mt-4 border-t border-[var(--border-soft)] pt-4' : ''}`}>
                  <p className="text-sm font-medium text-red-300">处理失败</p>
                  <p className="mt-2 text-xs leading-5 text-red-200/85">{analysisError}</p>
                </div>
              )}
            </section>
          )}

          <section className={`${sectionClassName} overflow-hidden`}>
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <div className="flex gap-2 overflow-x-auto">
                {resultTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveResultTab(tab.key as any)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm whitespace-nowrap transition ${
                      activeResultTab === tab.key
                        ? 'bg-primary-500 text-white shadow-brand'
                        : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/8 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[560px] overflow-y-auto px-4 py-4">
              {renderContent()}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 py-10 text-center text-sm leading-6 text-[var(--text-secondary)]">
      {text}
    </div>
  );
}
