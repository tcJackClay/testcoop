import { Folder, Clock, FileText, Play, Trash2 } from 'lucide-react';
import type { ProjectView } from '../../api/project';
import { getStatusColor, formatDate } from './projectTypes';

interface ProjectDetailProps {
  project: ProjectView;
  onDelete: (id: number) => void;
}

export default function ProjectDetail({ project, onDelete }: ProjectDetailProps) {
  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-6 overflow-auto shrink-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
          <Folder className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{project.name}</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.statusText)}`}>
            {project.statusText}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">项目描述</label>
          <p className="text-sm text-gray-300">
            {project.description || '暂无描述'}
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">创建时间</label>
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatDate(project.createTime)}
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">剧本文件</label>
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {project.scriptCount || 0} 个
          </p>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={() => onDelete(project.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除项目
          </button>
        </div>
      </div>
    </div>
  );
}
