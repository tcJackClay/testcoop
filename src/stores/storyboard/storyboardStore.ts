// src/stores/storyboard/storyboardStore.ts - 故事板 Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Episode, ShotGroup, Frame, StoryboardState } from './types';

interface StoryboardStore extends StoryboardState {
  setEpisodes: (episodes: Episode[]) => void;
  addEpisode: (episode: Episode) => void;
  updateEpisode: (id: number, updates: Partial<Episode>) => void;
  deleteEpisode: (id: number) => void;
  setCurrentEpisode: (id: number | null) => void;
  setScriptContent: (content: string) => void;
  setShotGroups: (groups: ShotGroup[]) => void;
  addShotGroup: (group: ShotGroup) => void;
  updateShotGroup: (id: string, updates: Partial<ShotGroup>) => void;
  deleteShotGroup: (id: string) => void;
  addFrame: (groupId: string, frame: Frame) => void;
  updateFrame: (groupId: string, frameId: string, updates: Partial<Frame>) => void;
  deleteFrame: (groupId: string, frameId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const getInitialState = (): StoryboardState => ({
  episodes: [],
  currentEpisodeId: null,
  scriptContent: '',
  shotGroups: [],
  isLoading: false,
  error: null,
});

export const useStoryboardStore = create<StoryboardStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setEpisodes: (episodes) => set({ episodes }),
      
      addEpisode: (episode) => set(state => ({
        episodes: [...state.episodes, episode]
      })),
      
      updateEpisode: (id, updates) => set(state => ({
        episodes: state.episodes.map(e => 
          e.id === id ? { ...e, ...updates } : e
        )
      })),
      
      deleteEpisode: (id) => set(state => ({
        episodes: state.episodes.filter(e => e.id !== id),
        currentEpisodeId: state.currentEpisodeId === id ? null : state.currentEpisodeId
      })),
      
      setCurrentEpisode: (id) => set({ currentEpisodeId: id }),
      
      setScriptContent: (content) => set({ scriptContent: content }),
      
      setShotGroups: (groups) => set({ shotGroups: groups }),
      
      addShotGroup: (group) => set(state => ({
        shotGroups: [...state.shotGroups, group]
      })),
      
      updateShotGroup: (id, updates) => set(state => ({
        shotGroups: state.shotGroups.map(g => 
          g.id === id ? { ...g, ...updates } : g
        )
      })),
      
      deleteShotGroup: (id) => set(state => ({
        shotGroups: state.shotGroups.filter(g => g.id !== id)
      })),
      
      addFrame: (groupId, frame) => set(state => ({
        shotGroups: state.shotGroups.map(g => 
          g.id === groupId 
            ? { ...g, frames: [...g.frames, frame] }
            : g
        )
      })),
      
      updateFrame: (groupId, frameId, updates) => set(state => ({
        shotGroups: state.shotGroups.map(g => 
          g.id === groupId 
            ? { 
                ...g, 
                frames: g.frames.map(f => 
                  f.id === frameId ? { ...f, ...updates } : f
                ) 
              }
            : g
        )
      })),
      
      deleteFrame: (groupId, frameId) => set(state => ({
        shotGroups: state.shotGroups.map(g => 
          g.id === groupId 
            ? { ...g, frames: g.frames.filter(f => f.id !== frameId) }
            : g
        )
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      reset: () => set(getInitialState()),
    }),
    {
      name: 'huanu-storyboard-store',
      partialize: (state) => ({
        episodes: state.episodes,
        currentEpisodeId: state.currentEpisodeId,
        shotGroups: state.shotGroups,
      }),
    }
  )
);
