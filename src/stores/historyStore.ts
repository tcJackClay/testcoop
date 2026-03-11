import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryItem, HistoryItemType, HistoryItemStatus } from '../types';

// Performance mode options
export type PerformanceMode = 'fast' | 'normal' | 'off';

interface HistoryState {
  // Data
  items: HistoryItem[];
  selectedItemId: string | null;
  performanceMode: PerformanceMode;
  thumbnailSize: number;
  
  // Pagination
  page: number;
  pageSize: number;
  total: number;
  
  // Filters
  filterType: HistoryItemType | 'all';
  filterStatus: HistoryItemStatus | 'all';
  
  // Actions
  addItem: (item: Omit<HistoryItem, 'id' | 'createTime'>) => void;
  updateItem: (id: string, data: Partial<HistoryItem>) => void;
  deleteItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  clearAll: () => void;
  
  // Filters
  setFilterType: (type: HistoryItemType | 'all') => void;
  setFilterStatus: (status: HistoryItemStatus | 'all') => void;
  setPage: (page: number) => void;
  
  // Performance
  setPerformanceMode: (mode: PerformanceMode) => void;
  
  // Computed
  getFilteredItems: () => HistoryItem[];
  
  // Send to canvas
  sendToCanvas: (item: HistoryItem) => void;
  
  // Send to chat
  sendToChat: (item: HistoryItem) => void;
  
  // Cache management
  getCacheSize: () => number;
  clearCache: () => void;
  rebuildThumbnail: (itemId: string) => void;
}

let itemIdCounter = 0;
const generateItemId = () => `history_${++itemIdCounter}`;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedItemId: null,
      performanceMode: 'normal',
      thumbnailSize: 150,
      page: 1,
      pageSize: 20,
      total: 0,
      filterType: 'all',
      filterStatus: 'all',

      addItem: (item) => {
        const newItem: HistoryItem = {
          ...item,
          id: generateItemId(),
          createTime: new Date().toISOString(),
        };
        set((state) => ({
          items: [newItem, ...state.items],
          total: state.total + 1,
        }));
      },

      updateItem: (id, data) => {
        set((state) => ({
          items: state.items.map((item) => 
            item.id === id ? { ...item, ...data } : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          total: Math.max(0, state.total - 1),
          selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
        }));
      },

      selectItem: (id) => {
        set({ selectedItemId: id });
      },

      clearAll: () => {
        set({ items: [], total: 0, selectedItemId: null });
      },

      setFilterType: (type) => {
        set({ filterType: type, page: 1 });
      },

      setFilterStatus: (status) => {
        set({ filterStatus: status, page: 1 });
      },

      setPage: (page) => {
        set({ page });
      },

      setPerformanceMode: (mode) => {
        const sizes = { fast: 80, normal: 150, off: 0 };
        set({ 
          performanceMode: mode,
          thumbnailSize: sizes[mode],
        });
      },

      getFilteredItems: () => {
        const { items, filterType, filterStatus } = get();
        return items.filter((item) => {
          if (filterType !== 'all' && item.type !== filterType) return false;
          if (filterStatus !== 'all' && item.status !== filterStatus) return false;
          return true;
        });
      },

      // Send history item to canvas
      sendToCanvas: (item) => {
        // Dynamically import canvas store to avoid circular dependency
        import('./canvasStore').then(({ useCanvasStore }) => {
          const canvasStore = useCanvasStore.getState();
          
          if (item.type === 'image' && item.imageUrls && item.imageUrls.length > 0) {
            // Add image node to canvas
            canvasStore.addNode('imageNode', { x: 100, y: 100 }, {
              data: {
                label: 'Image from History',
                imageUrl: item.imageUrls[0],
                prompt: item.prompt || '',
                status: 'completed',
              }
            });
          } else if (item.type === 'video' && item.videoUrl) {
            // Add video node to canvas
            canvasStore.addNode('videoNode', { x: 100, y: 100 }, {
              data: {
                label: 'Video from History',
                videoUrl: item.videoUrl,
                prompt: item.prompt || '',
                status: 'completed',
              }
            });
          }
        });
      },

      // Send history item to chat
      sendToChat: (item) => {
        // Dynamically import chat store to avoid circular dependency
        import('./chatStore').then(({ useChatStore }) => {
          const chatStore = useChatStore.getState();
          
          if (item.type === 'image' && item.imageUrls && item.imageUrls.length > 0) {
            chatStore.addAttachment({
              type: 'image',
              url: item.imageUrls[0],
              thumbnailUrl: item.thumbnailUrl || item.imageUrls[0],
            });
          } else if (item.type === 'video' && item.videoUrl) {
            chatStore.addAttachment({
              type: 'video',
              url: item.videoUrl,
              thumbnailUrl: item.thumbnailUrl,
            });
          }
          
          // Dispatch event to open chat panel
          window.dispatchEvent(new CustomEvent('history:send-to-chat', { detail: { item } }));
        });
      },

      // Get cache size (approximate)
      getCacheSize: () => {
        const { items } = get();
        let totalSize = 0;
        
        // Estimate size based on stored data
        items.forEach(item => {
          totalSize += JSON.stringify(item).length;
        });
        
        return totalSize;
      },

      // Clear all cached data
      clearCache: () => {
        set({ items: [], total: 0, selectedItemId: null });
      },

      // Rebuild thumbnail for an item
      rebuildThumbnail: (itemId) => {
        const { items } = get();
        const item = items.find(i => i.id === itemId);
        
        if (item && (item.type === 'image' || item.type === 'video')) {
          // In a real app, this would regenerate the thumbnail
          // For now, we'll just update the thumbnail URL
          const imageUrl = item.type === 'image' ? item.imageUrls?.[0] : item.videoUrl;
          
          if (imageUrl) {
            // Force reload the image to regenerate thumbnail
            const img = new Image();
            img.onload = () => {
              get().updateItem(itemId, { thumbnailUrl: imageUrl });
            };
            img.onerror = () => {
              console.error('Failed to rebuild thumbnail');
            };
            img.src = imageUrl;
          }
        }
      },
    }),
    {
      name: 'aigc-history-storage',
      partialize: (state) => ({
        items: state.items.slice(0, 1000), // Limit stored items
        performanceMode: state.performanceMode,
      }),
    }
  )
);
