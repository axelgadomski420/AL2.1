import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  conversationId: string;
  createdAt: Date;
  status?: 'pending' | 'streaming' | 'completed' | 'interrupted' | 'failed';
  model?: string;
  provider?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  sources?: Array<{
    id: string;
    type: 'memory' | 'document' | 'web' | 'tool';
    title: string;
    url?: string;
    content?: string;
  }>;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    status: 'pending' | 'completed' | 'failed';
  }>;
}

interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  model?: string;
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  messages: Message[];
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

interface ChatActions {
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>) => Conversation;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'> & { conversationId: string }) => Message;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  sendMessage: (conversationId: string, content: string) => Promise<Message | null>;
  regenerateMessage: (conversationId: string, messageId: string) => Promise<Message | null>;
  stopStreaming: () => void;
  getConversation: (id: string) => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
}

type ChatStore = ChatState & ChatActions;

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let abortController: AbortController | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  // State
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  isStreaming: false,
  error: null,

  // Actions
  setConversations: (conversations) => set({ conversations }),

  addConversation: (data) => {
    const conversation: Conversation = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
    };
    set((state) => ({
      conversations: [...state.conversations, conversation],
      currentConversationId: conversation.id,
    }));
    return conversation;
  },

  updateConversation: (id, updates) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
      ),
    }));
  },

  deleteConversation: (id) => {
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
    }));
  },

  setCurrentConversation: (id) => set({ currentConversationId: id }),

  addMessage: ({ conversationId, ...messageData }) => {
    const message: Message = {
      ...messageData,
      id: uuidv4(),
      createdAt: new Date(),
    };

    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message], updatedAt: new Date() }
          : conv
      ),
    }));

    return message;
  },

  updateMessage: (conversationId, messageId, updates) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
            }
          : conv
      ),
    }));
  },

  deleteMessage: (conversationId, messageId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: conv.messages.filter((msg) => msg.id !== messageId) }
          : conv
      ),
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setError: (error) => set({ error, isLoading: false, isStreaming: false }),

  getConversation: (id) => {
    const state = get();
    return state.conversations.find((conv) => conv.id === id);
  },

  getMessages: (conversationId) => {
    const conversation = get().getConversation(conversationId);
    return conversation?.messages || [];
  },

  stopStreaming: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    get().setStreaming(false);
  },

  sendMessage: async (conversationId, content) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      get().setError('Nie jesteś zalogowany');
      return null;
    }

    const { addMessage, updateMessage, setStreaming, setError, setLoading } = get();

    setLoading(true);
    setError(null);

    try {
      // Add user message
      const userMessage = addMessage({
        conversationId,
        role: 'user',
        content,
      });

      // Add placeholder for assistant response
      const assistantMessage = addMessage({
        conversationId,
        role: 'assistant',
        content: '',
        status: 'pending',
      });

      setLoading(false);
      setStreaming(true);

      // Create abort controller for streaming
      abortController = new AbortController();

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          message: content,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Błąd odpowiedzi serwera');
      }

      if (!response.body) {
        throw new Error('Brak strumienia odpowiedzi');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                updateMessage(conversationId, assistantMessage.id, {
                  content: accumulatedContent,
                  status: 'streaming',
                  model: parsed.model,
                  provider: parsed.provider,
                });
              }
              if (parsed.tokenUsage) {
                updateMessage(conversationId, assistantMessage.id, {
                  tokenUsage: parsed.tokenUsage,
                  status: 'completed',
                });
              }
              if (parsed.sources) {
                updateMessage(conversationId, assistantMessage.id, {
                  sources: parsed.sources,
                });
              }
              if (parsed.toolCalls) {
                updateMessage(conversationId, assistantMessage.id, {
                  toolCalls: parsed.toolCalls,
                });
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }

      // Final update
      updateMessage(conversationId, assistantMessage.id, {
        content: accumulatedContent,
        status: 'completed',
      });

      return assistantMessage;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was intentionally stopped
        updateMessage(conversationId, assistantMessage.id, {
          status: 'interrupted',
        });
      } else {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd');
        updateMessage(conversationId, assistantMessage.id, {
          content: 'Wystąpił błąd podczas generowania odpowiedzi.',
          status: 'failed',
        });
      }
      return null;
    } finally {
      setStreaming(false);
      setLoading(false);
      abortController = null;
    }
  },

  regenerateMessage: async (conversationId, messageId) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      get().setError('Nie jesteś zalogowany');
      return null;
    }

    const { updateMessage, setStreaming, setError, setLoading } = get();

    setLoading(true);
    setError(null);

    try {
      // Get the last user message to regenerate context
      const conversation = get().getConversation(conversationId);
      if (!conversation) {
        throw new Error('Konwersacja nie istnieje');
      }

      const lastUserMessage = [...conversation.messages]
        .reverse()
        .find((m) => m.role === 'user');

      if (!lastUserMessage) {
        throw new Error('Brak wiadomości użytkownika do regeneracji');
      }

      // Update the assistant message to show regenerating state
      updateMessage(conversationId, messageId, {
        content: '',
        status: 'pending',
      });

      setLoading(false);
      setStreaming(true);

      abortController = new AbortController();

      const response = await fetch(`${API_BASE}/chat/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          messageId,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Błąd odpowiedzi serwera');
      }

      if (!response.body) {
        throw new Error('Brak strumienia odpowiedzi');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                updateMessage(conversationId, messageId, {
                  content: accumulatedContent,
                  status: 'streaming',
                });
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }

      updateMessage(conversationId, messageId, {
        content: accumulatedContent,
        status: 'completed',
      });

      return get().getMessages(conversationId).find((m) => m.id === messageId) || null;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        updateMessage(conversationId, messageId, {
          status: 'interrupted',
        });
      } else {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd');
        updateMessage(conversationId, messageId, {
          content: 'Wystąpił błąd podczas regeneracji odpowiedzi.',
          status: 'failed',
        });
      }
      return null;
    } finally {
      setStreaming(false);
      setLoading(false);
      abortController = null;
    }
  },
}));
