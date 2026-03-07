import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryItem, HistoryItemType, HistoryItemStatus } from '../../types';

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
