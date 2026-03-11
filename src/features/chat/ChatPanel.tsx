import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, Bot, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChatStore, type ChatMessage as StoreChatMessage } from '../../stores/chatStore';

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { messages: storeMessages, addMessage, addAttachment } = useChatStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use store messages or local state
  const messages = storeMessages.length > 0 ? storeMessages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    addMessage({
      role: 'user',
      content: input.trim(),
    });
    
    setInput('');
    setIsLoading(true);

    // Simulate AI response (in real app, this would call an API)
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `收到您的消息: "${input.trim()}"\n\n这是一个模拟的AI对话功能。在完整实现中，这里会连接到您配置的大模型API来生成回复。\n\n您可以:\n- 询问关于工作流的问题\n- 获取使用帮助\n- 生成创意内容`,
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render attachment preview
  const renderAttachment = (attachment: StoreChatMessage['attachment']) => {
    if (!attachment) return null;
    
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-gray-600">
        {attachment.type === 'image' ? (
          <img 
            src={attachment.thumbnailUrl || attachment.url} 
            alt="Attachment" 
            className="max-w-full max-h-40 object-contain"
          />
        ) : (
          <video 
            src={attachment.url} 
            className="max-w-full max-h-40" 
            controls
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <span className="font-medium">AI 对话</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('chat.welcome') || '欢迎使用AI对话'}</p>
            <p className="text-xs mt-2 text-gray-600">
              可以询问关于工作流的问题，或从历史记录发送图片/视频到这里
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.attachment && renderAttachment(msg.attachment)}
                <p className="text-[10px] opacity-60 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder') || '发送消息...'}
            disabled={isLoading}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
