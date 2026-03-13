import { Folder, Edit, Trash2, Check } from 'lucide-react';
import type { ProjectView } from '../../api/project';
import { getStatusColor, formatDate } from './projectTypes';

interface ProjectCardProps {
  project: ProjectView;
  currentProjectId: number | null;
  selectedProjectId: number | null;
  onSelect: (project: ProjectView) => void;
  onDoubleClick: (project: ProjectView) => void;
  onEdit: (project: ProjectView) => void;
  onDelete: (id: number) => void;
  onSetCurrent?: (project: ProjectView) => void;
}

export default function ProjectCard({
  project,
  currentProjectId,
  selectedProjectId,
  onSelect,
  onDoubleClick,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  return (
    <div
      onClick={() => onSelect(project)}
      onDoubleClick={() => onDoubleClick(project)}
      className={`
        bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-lg
        ${currentProjectId === project.id 
          ? 'border-blue-500 ring-2 ring-blue-500/20' 
          : selectedProjectId === project.id
            ? 'border-blue-400 bg-blue-900/20'
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
            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
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
        <span>{formatDate(project.createTime)}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.statusText)}`}>
          {project.statusText}
        </span>
      </div>
    </div>
  );
}
