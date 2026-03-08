import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ProjectView } from '../api/project';

interface ProjectState {
  currentProjectId: number | null;
  currentProject: ProjectView | null;
  setCurrentProject: (project: ProjectView | null) => void;
  setCurrentProjectId: (id: number | null) => void;
  clearCurrentProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProjectId: null,
      currentProject: null,
      
      setCurrentProject: (project) => {
        set({ 
          currentProject: project, 
          currentProjectId: project?.id || null 
        });
      },
      
      setCurrentProjectId: (id) => {
        set({ currentProjectId: id });
      },
      
      clearCurrentProject: () => {
        set({ currentProject: null, currentProjectId: null });
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        currentProject: state.currentProject,
      }),
    }
  )
);

export default useProjectStore;
