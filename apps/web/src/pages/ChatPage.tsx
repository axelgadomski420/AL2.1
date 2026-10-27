import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { generateId, formatRelativeTime } from '@al/shared';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { VoiceButton } from '../components/Chat';

// Configure marked
marked.setOptions({
  sanitize: true,
  gfm: true,
  breaks: true,
});

const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    currentConversationId,
    isLoading,
    isStreaming,
    error,
    addConversation,
    setCurrentConversation,
    sendMessage,
    stopStreaming,
    getMessages,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with a default conversation
  useEffect(() => {
    if (user && conversations.length === 0) {
      const newConversation = addConversation({
        title: 'Nowa konwersacja',
      });
      setCurrentConversation(newConversation.id);
    }
  }, [user, conversations.length, addConversation, setCurrentConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversationId, conversations.find(c => c.id === currentConversationId)?.messages.length]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
        handleSendMessage();
      }
      // Escape to stop streaming
      if (e.key === 'Escape' && isStreaming) {
        stopStreaming();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming, stopStreaming, messageInput]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversationId || isSending || isStreaming) {
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(currentConversationId, messageInput.trim());
      setMessageInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    const newConversation = addConversation({
      title: 'Nowa konwersacja',
    });
    setCurrentConversation(newConversation.id);
    setMessageInput('');
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Sanitize and render markdown
  const renderMessage = (content: string): string => {
    const sanitized = DOMPurify.sanitize(content);
    return marked.parse(sanitized) as string;
  };

  return (
    <div className="chat-container h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-800 bg-primary-900/50">
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewChat}
            className="btn btn-secondary flex items-center gap-2"
            disabled={isStreaming}
          >
            <span>+</span>
            <span className="hidden sm:inline">Nowa rozmowa</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {currentConversation && (
            <div className="hidden md:block">
              <input
                type="text"
                value={currentConversation.title}
                onChange={(e) => {}}
                className="input bg-transparent border-none text-primary-50 placeholder-primary-400"
                placeholder="Tytuł konwersacji"
              />
            </div>
          )}
          {isStreaming && (
            <button
              onClick={stopStreaming}
              className="btn btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <span className="text-xs">Przerwij</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="chat-messages overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon text-6xl">💬</div>
            <div className="empty-state-title">Witaj w AL!</div>
            <div className="empty-state-description">
              Rozpocznij rozmowę, aby zadać pytanie lub poprosić o pomoc.
            </div>
            <div className="mt-6">
              <button
                onClick={handleNewChat}
                className="btn btn-primary"
              >
                Nowa rozmowa
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] lg:max-w-[60%] rounded-xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'message-user' 
                      : 'message-assistant'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">AL</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className="markdown-content text-sm"
                        dangerouslySetInnerHTML={{ __html: renderMessage(message.content) }}
                      />
                      <div className="flex items-center justify-end gap-4 mt-3 text-xs text-primary-400">
                        {message.status === 'streaming' && (
                          <span className="flex items-center gap-1">
                            <span className="spinner h-3 w-3 border-2" />
                            <span>Pisze...</span>
                          </span>
                        )}
                        {message.status === 'failed' && (
                          <span className="text-red-400">Błąd</span>
                        )}
                        <span>
                          {formatRelativeTime(new Date(message.createdAt))}
                        </span>
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-300 font-bold text-sm">
                          {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isSending && (
              <div className="flex justify-end">
                <div className="bg-primary-700 rounded-xl px-4 py-3 max-w-[80%] md:max-w-[70%] lg:max-w-[60%]">
                  <div className="flex items-center gap-2">
                    <span className="spinner h-4 w-4 border-2" />
                    <span className="text-primary-300">Wysyłanie...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-600/20 border border-red-500 rounded-xl px-4 py-3 max-w-[80%] md:max-w-[70%] lg:max-w-[60%]">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isStreaming ? "Czekaj na zakończenie odpowiedzi..." : "Wpisz wiadomość... (Ctrl+Enter do wysłania)"}
              disabled={isStreaming || isSending}
              className="w-full min-h-[56px] max-h-[200px] p-4 bg-primary-800 border border-primary-700 rounded-xl text-primary-50 placeholder-primary-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
            />
            
            <div className="absolute right-4 bottom-4 flex items-center gap-2">
              {isStreaming ? null : (
                <VoiceButton
                  onTranscript={(text) => setMessageInput(prev => prev + " " + text)}
                  onError={(err) => console.error("Voice error:", err)}
                  disabled={!messageInput.trim() || isSending}
                  size="md"
                />
              )
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isStreaming || isSending}
                className="btn btn-primary p-2 w-10 h-10 flex items-center justify-center disabled:opacity-50"
                aria-label="Wyślij wiadomość"
              >
                <span className="text-xl">→</span>
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3 text-xs text-primary-500">
            <div className="flex items-center gap-4">
              <span>Shift+Enter = nowa linia</span>
              <span>Ctrl+Enter = wyślij</span>
            </div>
            {currentConversation && (
              <span className="hidden md:block">
                {messages.length} wiadomości
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile toolbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary-900 border-t border-primary-800 p-4 safe-area-inset-bottom">
        <div className="toolbar">
          <button className="p-3 text-primary-400 hover:text-primary-50 hover:bg-primary-800 rounded-lg" aria-label="Nowa rozmowa">
            <span className="text-xl">+</span>
          </button>
          <button className="p-3 text-primary-400 hover:text-primary-50 hover:bg-primary-800 rounded-lg" aria-label="Mikrofon">
            <span className="text-xl">🎤</span>
          </button>
          <button className="p-3 text-primary-400 hover:text-primary-50 hover:bg-primary-800 rounded-lg" aria-label="Załącznik">
            <span className="text-xl">📎</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
