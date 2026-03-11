import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shot, ShotStatus, StoryboardViewMode, StoryboardMode, SplitMode } from '../types';

// Default LLM prompts for different split modes
const DEFAULT_STORYBOARD_SCRIPT_PROMPT = `你是一个分镜脚本分析专家。请将用户提供的脚本按镜头拆分，每个镜头生成一个简洁的画面描述提示词。
输出格式为 JSON 数组: [{"prompt": "镜头1的画面描述"}, {"prompt": "镜头2的画面描述"}, ...]
只输出 JSON，不要其他内容。`;

const DEFAULT_STORYBOARD_NOVEL_PROMPT = `你是影视分镜策划师。请把用户提供的小说/剧情文本拆分成镜头列表，每个镜头输出一句可直接用于生图/生视频的画面提示词。
要求：
1) 保留剧情顺序与关键动作；
2) 每个镜头一条，避免空话；
3) 输出格式必须是 JSON 数组: [{"prompt":"..."}, ...]
只输出 JSON，不要其他内容。`;

const DEFAULT_STORYBOARD_TABLE_SUMMARY_PROMPT = `你是影视分镜提示词整合专家。请基于用户提供的分镜表逐行生成可直接用于生图/生视频的镜头提示词。
要求：
1) 每一行输出一条提示词，必须保持与 scene_index 一一对应；
2) 提示词应综合景别、运镜、场景描述、人物动作、情绪、台词等字段；
3) 不要输出解释；
4) 仅输出 JSON 数组，
格式: [{"scene_index":1,"prompt":"..."},{"scene_index":2,"prompt":"..."}]`;

// Storyboard State
interface StoryboardState {
  // Data
  shots: Shot[];
  selectedShotId: string | null;
  viewMode: StoryboardViewMode;
  storyboardMode: StoryboardMode;
  isGenerating: boolean;
  
  // LLM Settings
  splitMode: SplitMode;
  llmPrompt: string;
  
  // Batch generation
  batchQueue: string[]; // shot IDs
  batchConcurrent: number;
  
  // Actions
  addShot: (shot?: Partial<Shot>) => void;
  updateShot: (id: string, data: Partial<Shot>) => void;
  deleteShot: (id: string) => void;
  selectShot: (id: string | null) => void;
  moveShot: (fromIndex: number, toIndex: number) => void;
  setViewMode: (mode: StoryboardViewMode) => void;
  setStoryboardMode: (mode: StoryboardMode) => void;
  setGenerating: (generating: boolean) => void;
  setSplitMode: (mode: SplitMode) => void;
  setLlmPrompt: (prompt: string) => void;
  
  // Batch operations
  toggleShotLock: (id: string) => void;
  toggleShotOutput: (id: string) => void;
  clearAllShots: () => void;
  importFromScript: (script: string) => void;
  importFromLLM: (script: string) => Promise<void>;
  importFromNovel: (novel: string) => Promise<void>;
  importFromTable: (tableText: string) => Promise<void>;
  
  // Batch generation
  addToBatchQueue: (shotIds: string[]) => void;
  removeFromBatchQueue: (shotId: string) => void;
  clearBatchQueue: () => void;
  generateBatch: () => void;
}

let shotIdCounter = 0;
const generateShotId = () => `shot_${++shotIdCounter}`;

export const useStoryboardStore = create<StoryboardState>()(
  persist(
    (set, get) => ({
      shots: [],
      selectedShotId: null,
      viewMode: 'card',
      storyboardMode: 'image',
      isGenerating: false,
      splitMode: 'script',
      llmPrompt: DEFAULT_STORYBOARD_SCRIPT_PROMPT,
      batchQueue: [],
      batchConcurrent: 1,

      addShot: (shot) => {
        const { shots, storyboardMode } = get();
        const newShot: Shot = {
          id: generateShotId(),
          index: shots.length,
          sceneNumber: Math.floor(shots.length / 5) + 1,
          shotNumber: shots.length + 1,
          description: '',
          prompt: '',
          status: 'pending',
          outputEnabled: true,
          locked: false,
          useFirstLastFrame: storyboardMode === 'video',
          useMultiRef: false,
          activeInput: 'single',
          referenceImages: [],
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

      setStoryboardMode: (mode) => {
        set({ storyboardMode: mode });
        // Update all shots to reflect mode change
        set((state) => ({
          shots: state.shots.map((s) => ({
            ...s,
            useFirstLastFrame: mode === 'video',
          })),
        }));
      },

      setGenerating: (generating) => {
        set({ isGenerating: generating });
      },

      setSplitMode: (mode) => {
        const prompts: Record<SplitMode, string> = {
          script: DEFAULT_STORYBOARD_SCRIPT_PROMPT,
          novel: DEFAULT_STORYBOARD_NOVEL_PROMPT,
          custom: DEFAULT_STORYBOARD_SCRIPT_PROMPT,
          table_summary: DEFAULT_STORYBOARD_TABLE_SUMMARY_PROMPT,
        };
        set({ splitMode: mode, llmPrompt: prompts[mode] });
      },

      setLlmPrompt: (prompt) => {
        set({ llmPrompt: prompt });
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
        set({ shots: [], selectedShotId: null, batchQueue: [] });
      },

      // Simple line-by-line parsing for script import
      importFromScript: (script) => {
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
          useFirstLastFrame: get().storyboardMode === 'video',
          useMultiRef: false,
          activeInput: 'single',
          referenceImages: [],
        }));
        set({ shots });
      },

      // LLM-based script splitting
      importFromLLM: async (script) => {
        const { llmPrompt, storyboardMode } = get();
        set({ isGenerating: true });

        try {
          // Call LLM API (placeholder - would need actual API integration)
          // For now, simulate the response
          const response = await fetch('/api/llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: llmPrompt,
              content: script,
            }),
          });

          if (!response.ok) {
            throw new Error('LLM API call failed');
          }

          const data = await response.json();
          const prompts = data.prompts || data.results || [];

          const shots: Shot[] = prompts.map((item: { prompt?: string; scene_index?: number }, index: number) => ({
            id: generateShotId(),
            index,
            sceneNumber: Math.floor(index / 5) + 1,
            shotNumber: index + 1,
            description: item.prompt || '',
            prompt: item.prompt || '',
            status: 'pending' as ShotStatus,
            outputEnabled: true,
            locked: false,
            useFirstLastFrame: storyboardMode === 'video',
            useMultiRef: false,
            activeInput: 'single',
            referenceImages: [],
          }));

          set({ shots });
        } catch (error) {
          console.error('LLM import failed:', error);
          // Fallback to simple parsing
          get().importFromScript(script);
        } finally {
          set({ isGenerating: false });
        }
      },

      // Novel import
      importFromNovel: async (novel) => {
        const { llmPrompt, storyboardMode } = get();
        set({ isGenerating: true });

        try {
          // Use novel-specific prompt
          const response = await fetch('/api/llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: DEFAULT_STORYBOARD_NOVEL_PROMPT,
              content: novel,
            }),
          });

          const data = await response.json();
          const prompts = data.prompts || data.results || [];

          const shots: Shot[] = prompts.map((item: { prompt?: string }, index: number) => ({
            id: generateShotId(),
            index,
            sceneNumber: Math.floor(index / 5) + 1,
            shotNumber: index + 1,
            description: item.prompt || '',
            prompt: item.prompt || '',
            status: 'pending' as ShotStatus,
            outputEnabled: true,
            locked: false,
            useFirstLastFrame: storyboardMode === 'video',
            useMultiRef: false,
            activeInput: 'single',
            referenceImages: [],
          }));

          set({ shots });
        } catch (error) {
          console.error('Novel import failed:', error);
          get().importFromScript(novel);
        } finally {
          set({ isGenerating: false });
        }
      },

      // Table import (CSV/Markdown table)
      importFromTable: async (tableText) => {
        const { storyboardMode } = get();
        set({ isGenerating: true });

        try {
          const response = await fetch('/api/llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: DEFAULT_STORYBOARD_TABLE_SUMMARY_PROMPT,
              content: tableText,
            }),
          });

          const data = await response.json();
          const results = data.results || [];

          const shots: Shot[] = results.map((item: { scene_index?: number; prompt?: string }, index: number) => ({
            id: generateShotId(),
            index,
            sceneNumber: item.scene_index || Math.floor(index / 5) + 1,
            shotNumber: index + 1,
            description: item.prompt || '',
            prompt: item.prompt || '',
            status: 'pending' as ShotStatus,
            outputEnabled: true,
            locked: false,
            useFirstLastFrame: storyboardMode === 'video',
            useMultiRef: false,
            activeInput: 'single',
            referenceImages: [],
          }));

          set({ shots });
        } catch (error) {
          console.error('Table import failed:', error);
          // Fallback: simple line parsing
          const lines = tableText.split('\n').filter((l) => l.trim() && !l.startsWith('|'));
          get().importFromScript(lines.join('\n'));
        } finally {
          set({ isGenerating: false });
        }
      },

      // Batch queue operations
      addToBatchQueue: (shotIds) => {
        set((state) => ({
          batchQueue: [...new Set([...state.batchQueue, ...shotIds])],
        }));
      },

      removeFromBatchQueue: (shotId) => {
        set((state) => ({
          batchQueue: state.batchQueue.filter((id) => id !== shotId),
        }));
      },

      clearBatchQueue: () => {
        set({ batchQueue: [] });
      },

      // Generate batch (placeholder - needs actual API integration)
      generateBatch: () => {
        const { batchQueue, shots } = get();
        const shotsToGenerate = shots.filter(
          (s) => batchQueue.includes(s.id) && s.outputEnabled && !s.locked
        );

        if (shotsToGenerate.length === 0) return;

        set({ isGenerating: true });

        // Update all shots to generating status
        shotsToGenerate.forEach((shot) => {
          set((state) => ({
            shots: state.shots.map((s) =>
              s.id === shot.id ? { ...s, status: 'generating' as ShotStatus } : s
            ),
          }));
        });

        // TODO: Implement actual batch generation API call
        // This would typically:
        // 1. Send all shot IDs to the server
        // 2. Server processes them in parallel (based on concurrent setting)
        // 3. Updates return with results
        // 4. Update shot status based on results
      },
    }),
    {
      name: 'aigc-storyboard-storage',
      partialize: (state) => ({
        shots: state.shots.slice(0, 100), // Limit stored shots
        viewMode: state.viewMode,
        storyboardMode: state.storyboardMode,
        splitMode: state.splitMode,
        llmPrompt: state.llmPrompt,
      }),
    }
  )
);
