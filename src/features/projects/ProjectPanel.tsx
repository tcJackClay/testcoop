import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Edit, Trash2, Check, Folder, X, Loader2 } from 'lucide-react';
import { projectApi, projectViewApi, type ProjectView } from '../../api/project';
import { useAuthStore } from '../../stores/authStore';

interface ProjectPanelProps {
  onSelectProject?: (project: ProjectView) => void;
  onBackToCanvas?: () => void;
}

export default function ProjectPanel({ onSelectProject, onBackToCanvas }: ProjectPanelProps) {
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectView | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { token } = useAuthStore();

  // Load projects
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await projectViewApi.getAll();
      setProjects(data);
      // Load current project from localStorage
      const saved = localStorage.getItem('current_project_id');
      if (saved) setCurrentProjectId(parseInt(saved));
    } catch (err: any) {
      console.error('加载项目失败:', err);
      const errorMsg = err.response?.data?.message || err.message || '加载项目失败';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载 + 登录状态变化时刷新
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const handleCreate = () => {
    setEditingProject(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('1');
    setFormError('');
    setShowModal(true);
  };

  const handleEdit = (project: ProjectView) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || '');
    if (project.statusText === '进行中') setFormStatus('1');
    else if (project.statusText === '已完成') setFormStatus('2');
    else setFormStatus('0');
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('请输入项目名称');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingProject) {
        await projectViewApi.update(editingProject.id, formName, formDescription, formStatus);
      } else {
        await projectViewApi.create(formName, formDescription);
      }
      
      await fetchProjects();
      handleCloseModal();
    } catch (err) {
      setFormError(editingProject ? '更新项目失败' : '创建项目失败');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!window.confirm('确定要删除这个项目吗？')) return;
    
    try {
      await projectApi.delete(projectId);
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        localStorage.removeItem('current_project_id');
      }
      await fetchProjects();
    } catch (err) {
      console.error('删除项目失败:', err);
      alert('删除项目失败');
    }
  };

  const handleSelectProject = (project: ProjectView) => {
    setCurrentProjectId(project.id);
    localStorage.setItem('current_project_id', project.id.toString());
    onSelectProject?.(project);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">项目管理</h1>
            <p className="text-sm text-gray-400">管理您的项目</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建项目
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {isLoading && projects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>加载中...</span>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-xl border border-dashed border-gray-700">
            <Folder className="w-12 h-12 text-gray-500 mb-3" />
            <p className="text-gray-300 font-medium">暂无项目</p>
            <p className="text-sm text-gray-500 mt-1">点击右上角"创建项目"开始</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className={`
                  bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-lg
                  ${currentProjectId === project.id 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-gray-700 hover:border-blue-400'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      ${currentProjectId === project.id ? 'bg-blue-600' : 'bg-gray-700'}
                    `}>
                      <Folder className={`w-4 h-4 ${currentProjectId === project.id ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    {currentProjectId === project.id && (
                      <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        当前项目
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(project); }}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-white mb-1 truncate">
                  {project.name}
                </h3>
                
                {project.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {project.createTime 
                      ? new Date(project.createTime).toLocaleDateString('zh-CN')
                      : '-'
                    }
                  </span>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs
                    ${project.statusText === '进行中' ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}
                  `}>
                    {project.statusText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                {editingProject ? '编辑项目' : '创建项目'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    项目名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="请输入项目名称"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    项目描述
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="请输入项目描述（可选）"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Status (only for edit) */}
                {editingProject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      项目状态
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="1">进行中</option>
                      <option value="2">已完成</option>
                      <option value="0">已归档</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProject ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
