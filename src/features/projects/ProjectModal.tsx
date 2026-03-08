import { Loader2 } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  editingProject: { id: number; name: string; description?: string; statusText?: string } | null;
  formName: string;
  formDescription: string;
  formStatus: string;
  isSubmitting: boolean;
  formError: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function ProjectModal({
  isOpen,
  editingProject,
  formName,
  formDescription,
  formStatus,
  isSubmitting,
  formError,
  onNameChange,
  onDescriptionChange,
  onStatusChange,
  onSubmit,
  onClose,
}: ProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-lg font-bold text-white mb-4">
          {editingProject ? '编辑项目' : '创建项目'}
        </h2>
        
        <form onSubmit={onSubmit}>
          {formError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">项目名称 *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="请输入项目名称"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">项目描述</label>
              <textarea
                value={formDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                placeholder="请输入项目描述（可选）"
              />
            </div>

            {editingProject && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">项目状态</label>
                <select
                  value={formStatus}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="1">进行中</option>
                  <option value="2">已完成</option>
                  <option value="0">已归档</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
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
  );
}
