/**
 * AIChatPane Component
 * Right panel for AI assistant interactions
 */

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestion?: {
    code: string;
    language: string;
    startLine?: number;
    endLine?: number;
  };
  applied?: boolean;
}

interface AIChatPaneProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion?: (suggestion: Message['suggestion']) => void;
  selectedCode?: string;
  currentFileName?: string;
}

export function AIChatPane({
  isOpen,
  onClose,
  onApplySuggestion,
  selectedCode,
  currentFileName,
}: AIChatPaneProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Prefill with selected code
  useEffect(() => {
    if (selectedCode && isOpen) {
      setInput(`Explain this code:\n\`\`\`\n${selectedCode}\n\`\`\``);
    }
  }, [selectedCode, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Call AI service
      // For now, mock response
      await new Promise((r) => setTimeout(r, 1500));

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'This is a placeholder response. The AI service will be integrated in T4-01.',
        timestamp: new Date(),
        suggestion: input.toLowerCase().includes('fix') || input.toLowerCase().includes('improve')
          ? {
              code: '// Improved code will appear here',
              language: 'typescript',
            }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (message: Message) => {
    if (message.suggestion && onApplySuggestion) {
      onApplySuggestion(message.suggestion);
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, applied: true } : m))
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-pane h-full flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-default)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-medium text-[var(--text-primary)]">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]"
        >
          ✕
        </button>
      </div>

      {/* Context indicator */}
      {currentFileName && (
        <div className="px-4 py-2 bg-[var(--bg-tertiary)] text-xs text-[var(--text-muted)]">
          Context: {currentFileName}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-8">
            <p className="text-lg mb-2">👋 How can I help?</p>
            <p className="text-sm">
              Ask me to explain, improve, or debug your code.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {['Explain this', 'Fix the bug', 'Add tests', 'Improve performance'].map(
                (prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] rounded-lg px-4 py-2
                  ${message.role === 'user'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  }
                `}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Code suggestion */}
                {message.suggestion && (
                  <div className="mt-3 rounded bg-[var(--bg-primary)] p-3">
                    <pre className="text-xs overflow-x-auto">
                      <code>{message.suggestion.code}</code>
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleApply(message)}
                        disabled={message.applied}
                        className={`
                          px-3 py-1 text-xs rounded font-medium
                          ${message.applied
                            ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                            : 'bg-[var(--accent)] text-white hover:opacity-90'
                          }
                        `}
                      >
                        {message.applied ? '✓ Applied' : 'Apply'}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(message.suggestion!.code)}
                        className="px-3 py-1 text-xs rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                
                <p className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-tertiary)] rounded-lg px-4 py-2">
              <span className="animate-pulse">🤖 Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border-default)]">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI anything... (Enter to send)"
            className="flex-1 px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg resize-none focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Tip: Select code in the editor to add context
        </p>
      </div>
    </div>
  );
}

export default AIChatPane;
