/**
 * ChatPane Component
 * AI chat interface for code assistance
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPaneProps {
  workspaceId: string;
  fileId?: string;
  fileName?: string;
  selectedCode?: string;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ChatPane({ workspaceId, fileId, fileName, selectedCode, onClose }: ChatPaneProps) {
  const { getAccessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{ available: boolean; provider: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check AI availability on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ai/status`);
        const data = await response.json();
        setAiStatus(data);
      } catch {
        setAiStatus({ available: false, provider: 'None' });
      }
    };
    checkStatus();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const token = getAccessToken();
    if (!token) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          message: userMessage.content,
          context: {
            fileId,
            fileName,
            selectedCode,
          },
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Chat failed');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, workspaceId, fileId, fileName, selectedCode, getAccessToken]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: 'Explain', action: 'Explain this code' },
    { label: 'Improve', action: 'Suggest improvements for this code' },
    { label: 'Fix', action: 'Find and fix bugs in this code' },
    { label: 'Document', action: 'Add documentation comments to this code' },
  ];

  const handleQuickAction = (action: string) => {
    if (selectedCode) {
      setInput(`${action}:\n\`\`\`\n${selectedCode}\n\`\`\``);
    } else {
      setInput(action);
    }
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Format message content with code blocks
  const formatContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const language = lines[0].slice(3);
        const code = lines.slice(1, -1).join('\n');
        
        return (
          <div key={index} className="my-2 rounded-lg overflow-hidden">
            {language && (
              <div className="bg-gray-900 px-3 py-1 text-xs text-gray-400">
                {language}
              </div>
            )}
            <pre className="bg-gray-900 p-3 overflow-x-auto">
              <code className="text-sm text-gray-200">{code}</code>
            </pre>
          </div>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">AI Assistant</span>
          {aiStatus && (
            <span className={`w-2 h-2 rounded-full ${aiStatus.available ? 'bg-green-500' : 'bg-red-500'}`} 
                  title={aiStatus.provider} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-gray-400 hover:text-white text-xs"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Context indicator */}
      {(fileName || selectedCode) && (
        <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700 text-xs text-gray-400">
          {fileName && <span>Context: {fileName}</span>}
          {selectedCode && (
            <span className="ml-2 text-blue-400">
              ({selectedCode.split('\n').length} lines selected)
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm">Ask me anything about your code!</p>
            <p className="text-xs mt-1">I can explain, improve, fix, or generate code.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {message.role === 'assistant' 
                  ? formatContent(message.content)
                  : message.content
                }
              </div>
              <div className="text-xs opacity-50 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full" style={{ animationDelay: '0ms' }} />
                <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full" style={{ animationDelay: '150ms' }} />
                <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {selectedCode && (
        <div className="px-3 py-2 border-t border-gray-700 flex gap-2 overflow-x-auto">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.action)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded whitespace-nowrap"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        {!aiStatus?.available && (
          <div className="mb-2 text-xs text-yellow-500">
            ⚠️ AI is not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
            rows={2}
            disabled={isLoading || !aiStatus?.available}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !aiStatus?.available}
            className="px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
