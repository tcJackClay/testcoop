// Chat Store - 聊天面板状态管理
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
  };
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addAttachment: (attachment: ChatMessage['attachment']) => void;
  clearMessages: () => void;
  setOpen: (open: boolean) => void;
}

let messageIdCounter = 0;
const generateMessageId = () => `chat_${++messageIdCounter}`;

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateMessageId(),
          timestamp: new Date(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },

      addAttachment: (attachment) => {
        if (!attachment) return;
        
        const message: ChatMessage = {
          id: generateMessageId(),
          role: 'user',
          content: `分享了一个${attachment.type === 'image' ? '图片' : '视频'}`,
          timestamp: new Date(),
          attachment,
        };
        set((state) => ({
          messages: [...state.messages, message],
          isOpen: true, // Open chat when receiving attachment
        }));
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      setOpen: (open) => {
        set({ isOpen: open });
      },
    }),
    {
      name: 'aigc-chat-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Keep last 50 messages
      }),
    }
  )
);
