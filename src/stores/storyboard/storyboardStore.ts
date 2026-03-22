import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shot, SplitMode, StoryboardMode, StoryboardViewMode } from '../../types/storyboard';

const getCurrentProjectId = (): number | null => {
  try {
    const raw = localStorage.getItem('project-storage');
    if (!raw) return null;
    return JSON.parse(raw).state?.currentProjectId ?? null;
  } catch {
    return null;
  }
};

const createShot = (index: number, description = ''): Shot => ({
  id: `shot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  index,
  sceneNumber: index + 1,
  shotNumber: index + 1,
  description,
  status: 'pending',
  outputEnabled: true,
  locked: false,
});

const parseShotsFromText = (content: string): Shot[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [createShot(0)];
  }

  return lines.map((line, index) => createShot(index, line));
};

export interface StoryboardStore {
  currentProjectId: number | null;
  shots: Shot[];
  selectedShotId: string | null;
  viewMode: StoryboardViewMode;
  storyboardMode: StoryboardMode;
  isGenerating: boolean;
  splitMode: SplitMode;
  llmPrompt: string;
  batchQueue: string[];
  setCurrentProjectId: (projectId: number | null) => void;
  addShot: (shot?: Partial<Shot>) => void;
  updateShot: (id: string, updates: Partial<Shot>) => void;
  selectShot: (id: string | null) => void;
  setViewMode: (mode: StoryboardViewMode) => void;
  setStoryboardMode: (mode: StoryboardMode) => void;
  setSplitMode: (mode: SplitMode) => void;
  setLlmPrompt: (prompt: string) => void;
  clearAllShots: () => void;
  importFromScript: (content: string) => void;
  importFromLLM: (content: string) => Promise<void>;
  importFromNovel: (content: string) => Promise<void>;
  importFromTable: (content: string) => Promise<void>;
  addToBatchQueue: (shotIds: string[]) => void;
  removeFromBatchQueue: (shotId: string) => void;
  clearBatchQueue: () => void;
  generateBatch: () => Promise<void>;
  toggleShotLock: (shotId: string) => void;
  toggleShotOutput: (shotId: string) => void;
}

export const useStoryboardStore = create<StoryboardStore>()(
  persist(
    (set, get) => ({
      currentProjectId: getCurrentProjectId(),
      shots: [],
      selectedShotId: null,
      viewMode: 'card',
      storyboardMode: 'image',
      isGenerating: false,
      splitMode: 'script',
      llmPrompt: '',
      batchQueue: [],

      setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),

      addShot: (shot) =>
        set((state) => {
          const nextIndex = state.shots.length;
          const generated = createShot(nextIndex);
          const newShot: Shot = {
            ...generated,
            ...shot,
            id: shot?.id ?? generated.id,
            index: nextIndex,
            sceneNumber: shot?.sceneNumber ?? nextIndex + 1,
            shotNumber: shot?.shotNumber ?? nextIndex + 1,
            status: shot?.status ?? 'pending',
            outputEnabled: shot?.outputEnabled ?? true,
            locked: shot?.locked ?? false,
          };

          return {
            shots: [...state.shots, newShot],
            selectedShotId: newShot.id,
          };
        }),

      updateShot: (id, updates) =>
        set((state) => ({
          shots: state.shots.map((shot) => (shot.id === id ? { ...shot, ...updates } : shot)),
        })),

      selectShot: (selectedShotId) => set({ selectedShotId }),
      setViewMode: (viewMode) => set({ viewMode }),
      setStoryboardMode: (storyboardMode) => set({ storyboardMode }),
      setSplitMode: (splitMode) => set({ splitMode }),
      setLlmPrompt: (llmPrompt) => set({ llmPrompt }),

      clearAllShots: () =>
        set({
          shots: [],
          selectedShotId: null,
          batchQueue: [],
        }),

      importFromScript: (content) => {
        const shots = parseShotsFromText(content);
        set({
          shots,
          selectedShotId: shots[0]?.id ?? null,
          batchQueue: [],
        });
      },

      importFromLLM: async (content) => {
        get().importFromScript(content);
      },

      importFromNovel: async (content) => {
        get().importFromScript(content);
      },

      importFromTable: async (content) => {
        get().importFromScript(content);
      },

      addToBatchQueue: (shotIds) =>
        set((state) => ({
          batchQueue: Array.from(new Set([...state.batchQueue, ...shotIds])),
        })),

      removeFromBatchQueue: (shotId) =>
        set((state) => ({
          batchQueue: state.batchQueue.filter((id) => id !== shotId),
        })),

      clearBatchQueue: () => set({ batchQueue: [] }),

      generateBatch: async () => {
        const queue = get().batchQueue;
        if (queue.length === 0) return;

        set({ isGenerating: true });

        try {
          set((state) => ({
            shots: state.shots.map((shot) =>
              queue.includes(shot.id) ? { ...shot, status: 'completed' } : shot
            ),
            batchQueue: [],
          }));
        } finally {
          set({ isGenerating: false });
        }
      },

      toggleShotLock: (shotId) =>
        set((state) => ({
          shots: state.shots.map((shot) =>
            shot.id === shotId ? { ...shot, locked: !shot.locked } : shot
          ),
        })),

      toggleShotOutput: (shotId) =>
        set((state) => ({
          shots: state.shots.map((shot) =>
            shot.id === shotId ? { ...shot, outputEnabled: !shot.outputEnabled } : shot
          ),
        })),
    }),
    {
      name: 'huanu-storyboard-store',
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        shots: state.shots,
        selectedShotId: state.selectedShotId,
        viewMode: state.viewMode,
        storyboardMode: state.storyboardMode,
        splitMode: state.splitMode,
        llmPrompt: state.llmPrompt,
      }),
    }
  )
);
