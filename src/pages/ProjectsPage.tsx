// src/pages/ProjectsPage.tsx - 项目列表页面
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, FolderOpen } from 'lucide-react';
import { projectApi, projectViewApi, type ProjectView } from '../api/project';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import ProjectCard from '../features/projects/ProjectCard';
import ProjectDetail from '../features/projects/ProjectDetail';
import ProjectModal from '../features/projects/ProjectModal';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const { currentProjectId, setCurrentProject } = useProjectStore();
  
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectView | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectView | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Load projects
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await projectViewApi.getAll();
      setProjects(data);
    } catch (err: any) {
      console.error('[ProjectsPage] 加载项目失败:', err);
      const errorMsg = err.response?.data?.message || err.message || '加载项目失败';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载 + 登录状态变化时刷新
  useEffect(() => {
    fetchProjects();
  }, [token]);

  // 点击选择项目
  const handleSelectProject = (project: ProjectView) => {
    setSelectedProject(project);
  };

  // 双击进入画布
  const handleDoubleClick = (project: ProjectView) => {
    setCurrentProject(project);
    navigate('/canvas');
  };

  // 单击设为当前项目并进入画布
  const handleSetCurrent = (project: ProjectView) => {
    setCurrentProject(project);
    navigate('/canvas');
  };

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
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      await fetchProjects();
    } catch (err) {
      console.error('删除项目失败:', err);
      alert('删除项目失败');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">项目管理</h1>
            <p className="text-sm text-gray-400">双击项目进入画布</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            退出登录
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建项目
          </button>
        </div>
      </div>

      {/* Content - 分两部分：项目列表 + 项目详情 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：项目列表 */}
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
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentProjectId={currentProjectId}
                  selectedProjectId={selectedProject?.id ?? null}
                  onSelect={handleSelectProject}
                  onDoubleClick={handleDoubleClick}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetCurrent={handleSetCurrent}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右侧：项目详情 */}
        {selectedProject && (
          <ProjectDetail
            project={selectedProject}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal */}
      <ProjectModal
        isOpen={showModal}
        editingProject={editingProject}
        formName={formName}
        formDescription={formDescription}
        formStatus={formStatus}
        isSubmitting={isSubmitting}
        formError={formError}
        onNameChange={setFormName}
        onDescriptionChange={setFormDescription}
        onStatusChange={setFormStatus}
        onSubmit={handleSubmit}
        onClose={handleCloseModal}
      />
    </div>
  );
}
