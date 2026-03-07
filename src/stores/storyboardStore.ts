import { create } from 'zustand';
import type { Shot, ShotStatus, StoryboardViewMode } from '../../types';

// Storyboard State
interface StoryboardState {
  // Data
  shots: Shot[];
  selectedShotId: string | null;
  viewMode: StoryboardViewMode;
  isGenerating: boolean;
  
  // Actions
  addShot: (shot?: Partial<Shot>) => void;
  updateShot: (id: string, data: Partial<Shot>) => void;
  deleteShot: (id: string) => void;
  selectShot: (id: string | null) => void;
  moveShot: (fromIndex: number, toIndex: number) => void;
  setViewMode: (mode: StoryboardViewMode) => void;
  setGenerating: (generating: boolean) => void;
  
  // Batch operations
  toggleShotLock: (id: string) => void;
  toggleShotOutput: (id: string) => void;
  clearAllShots: () => void;
  importFromScript: (script: string) => void;
}

let shotIdCounter = 0;
const generateShotId = () => `shot_${++shotIdCounter}`;

export const useStoryboardStore = create<StoryboardState>((set, get) => ({
  shots: [],
  selectedShotId: null,
  viewMode: 'card',
  isGenerating: false,

  addShot: (shot) => {
    const { shots } = get();
    const newShot: Shot = {
      id: generateShotId(),
      index: shots.length,
      sceneNumber: 1,
      shotNumber: shots.length + 1,
      description: '',
      prompt: '',
      status: 'pending',
      outputEnabled: true,
      locked: false,
      ...shot,
    };
    set({ shots: [...shots, newShot] });
  },

  updateShot: (id, data) => {
    set((state) => ({
      shots: state.shots.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
  },

  deleteShot: (id) => {
    set((state) => ({
      shots: state.shots.filter((s) => s.id !== id),
      selectedShotId: state.selectedShotId === id ? null : state.selectedShotId,
    }));
  },

  selectShot: (id) => {
    set({ selectedShotId: id });
  },

  moveShot: (fromIndex, toIndex) => {
    set((state) => {
      const newShots = [...state.shots];
      const [removed] = newShots.splice(fromIndex, 1);
      newShots.splice(toIndex, 0, removed);
      return {
        shots: newShots.map((s, i) => ({ ...s, index: i, shotNumber: i + 1 })),
      };
    });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  setGenerating: (generating) => {
    set({ isGenerating: generating });
  },

  toggleShotLock: (id) => {
    set((state) => ({
      shots: state.shots.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)),
    }));
  },

  toggleShotOutput: (id) => {
    set((state) => ({
      shots: state.shots.map((s) => (s.id === id ? { ...s, outputEnabled: !s.outputEnabled } : s)),
    }));
  },

  clearAllShots: () => {
    set({ shots: [], selectedShotId: null });
  },

  importFromScript: (script) => {
    // Simple line-by-line parsing for now
    const lines = script.split('\n').filter((l) => l.trim());
    const shots: Shot[] = lines.map((line, index) => ({
      id: generateShotId(),
      index,
      sceneNumber: Math.floor(index / 5) + 1,
      shotNumber: index + 1,
      description: line.trim(),
      prompt: '',
      status: 'pending' as ShotStatus,
      outputEnabled: true,
      locked: false,
    }));
    set({ shots });
  },
}));
