import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChatStore, type ChatMessage as StoreChatMessage } from '../../stores/chatStore';

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { messages: storeMessages, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = storeMessages.length > 0 ? storeMessages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    addMessage({
      role: 'user',
      content,
    });

    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `已收到你的消息：“${content}”。\n\n当前面板仍是演示版 AI 对话，后续接入模型服务后，这里会返回真实的协作建议、流程说明和内容生成结果。`,
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const renderAttachment = (attachment: StoreChatMessage['attachment']) => {
    if (!attachment) return null;

    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)]">
        {attachment.type === 'image' ? (
          <img
            src={attachment.thumbnailUrl || attachment.url}
            alt="Attachment"
            className="max-h-44 w-full object-contain"
          />
        ) : (
          <video src={attachment.url} className="max-h-44 w-full" controls />
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border-soft)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-meta">AI Assistant</p>
            <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">对话面板</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">围绕当前项目进行提问、追问和引用素材。</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white/5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/5 px-6 py-8 text-center shadow-soft">
              <Bot className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
              <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">{t('chat.welcome') || '欢迎使用 AI 对话'}</p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                可以直接提问，也可以从历史面板拖入图片或视频，让对话围绕当前项目上下文展开。
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-[22px] px-4 py-3 shadow-soft ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'border border-[var(--border-soft)] bg-[var(--surface-2)] text-[var(--text-primary)]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-6">{msg.content}</p>
                  {msg.attachment && renderAttachment(msg.attachment)}
                  <p className={`mt-2 text-[10px] ${msg.role === 'user' ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-[18px] border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 shadow-soft">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border-soft)] p-4">
        <div className="flex gap-2 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-2)] p-2 shadow-soft">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder') || '输入你的问题或操作指令'}
            disabled={isLoading}
            className="field-input h-11 flex-1 border-0 bg-transparent px-3 shadow-none focus:ring-0"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading}
            className="btn btn-primary h-11 w-11 justify-center rounded-2xl px-0 disabled:opacity-50"
            title="发送"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
