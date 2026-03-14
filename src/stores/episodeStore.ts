import { create } from 'zustand';
import { episodeScriptApi } from '@/api';

export interface Episode {
  id: number;
  title?: string;
  name?: string;
  content?: string;
  episodeNumber?: number;
  resourceName?: string;
}

interface EpisodeState {
  episodes: Episode[];
  selectedEpisodeId: string;
  loading: boolean;
  loadEpisodes: (projectId: number) => Promise<void>;
  setSelectedEpisodeId: (id: string) => void;
}

export const useEpisodeStore = create<EpisodeState>((set, get) => ({
  episodes: [],
  selectedEpisodeId: '',
  loading: false,

  loadEpisodes: async (projectId: number) => {
    if (!projectId) return;
    
    set({ loading: true });
    try {
      const response = await episodeScriptApi.getList(projectId) as any;
      
      // 处理两种响应格式
      let scriptList: any[] = [];
      if (Array.isArray(response.data)) {
        scriptList = response.data;
      } else if (response.data?.code === 0 && Array.isArray(response.data?.data)) {
        scriptList = response.data.data;
      }
      
      if (scriptList.length > 0) {
        const firstScript = scriptList[0];
        if (firstScript.resourceContent) {
          const content = JSON.parse(firstScript.resourceContent);
          if (content.episodes && content.episodes.length > 0) {
            const episodes = content.episodes as Episode[];
            set({ 
              episodes, 
              selectedEpisodeId: get().selectedEpisodeId || String(episodes[0].id)
            });
            return;
          }
        }
      }
      set({ episodes: [], selectedEpisodeId: '' });
    } catch (error) {
      console.error('加载分集失败:', error);
      set({ episodes: [], selectedEpisodeId: '' });
    } finally {
      set({ loading: false });
    }
  },

  setSelectedEpisodeId: (id: string) => {
    set({ selectedEpisodeId: id });
  },
}));
