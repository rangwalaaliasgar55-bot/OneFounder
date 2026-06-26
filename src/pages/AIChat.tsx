import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain,
  Code,
  Search,
  Shield,
  BarChart3,
  Microscope,
  DollarSign,
  Puzzle,
  Rocket,
  Send,
  Sparkles,
  User,
  Plus,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { askAI, type AIMessage } from '../lib/ai';
import { EXPERT_MODES, getSystemPrompt, detectMode } from '../lib/expertModes';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useToast } from '../components/useToast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const modeIcons: Record<string, React.ReactNode> = {
  founder: <Brain className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  seo: <Search className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  data: <BarChart3 className="w-4 h-4" />,
  research: <Microscope className="w-4 h-4" />,
  finance: <DollarSign className="w-4 h-4" />,
  product: <Puzzle className="w-4 h-4" />,
  startup: <Rocket className="w-4 h-4" />,
};

const STORAGE_KEY = 'onefounder_conversations';

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

export default function AIChat() {
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to OneFounder AI! I'm your intelligent assistant with 9 expert modes. Ask me anything about your startup - from code reviews to fundraising strategies. How can I help you today?",
      mode: 'founder',
    },
  ]);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState('founder');
  const [isTyping, setIsTyping] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestedMode, setSuggestedMode] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const detectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const autoGrow = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 6 * 24)}px`;
  };

  useEffect(() => {
    autoGrow();
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (detectTimer.current) clearTimeout(detectTimer.current);
    detectTimer.current = setTimeout(() => {
      const detected = detectMode(e.target.value);
      if (detected && detected !== activeMode) {
        setSuggestedMode(detected);
        setTimeout(() => setSuggestedMode(null), 3000);
      }
    }, 500);
  };

  const startNewChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "New conversation started. What would you like to discuss?",
        mode: activeMode,
      },
    ]);
    setActiveConvId(null);
    setShowHistory(false);
  };

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setActiveConvId(conv.id);
    setShowHistory(false);
  };

  const saveCurrentConversation = useCallback((msgs: Message[]) => {
    if (msgs.length <= 1) return;
    const userMsgs = msgs.filter((m) => m.role === 'user');
    if (userMsgs.length === 0) return;
    const title = userMsgs[0].content.slice(0, 40);
    if (activeConvId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, title, messages: msgs } : c)),
      );
    } else {
      const newConv: Conversation = {
        id: crypto.randomUUID(),
        title,
        messages: msgs,
        createdAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    }
  }, [activeConvId]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const aiMessages: AIMessage[] = newMessages
      .filter((m) => m.id !== '1' || m.role === 'user')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await askAI(aiMessages, getSystemPrompt(activeMode));
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.text,
        mode: activeMode,
      };
      const updated = [...newMessages, aiResponse];
      setMessages(updated);
      setTokensUsed((prev) => prev + res.tokensUsed);
      saveCurrentConversation(updated);
    } catch {
      toast('Failed to get AI response. Please try again.', 'error');
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        mode: activeMode,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, activeMode, toast, saveCurrentConversation]);

  const handleRegenerate = async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || isTyping) return;
    const withoutLast = messages.slice(0, -1);
    setMessages(withoutLast);
    setIsTyping(true);
    const aiMessages: AIMessage[] = withoutLast
      .map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await askAI(aiMessages, getSystemPrompt(activeMode));
      setMessages([...withoutLast, { id: crypto.randomUUID(), role: 'assistant', content: res.text, mode: activeMode }]);
      setTokensUsed((prev) => prev + res.tokensUsed);
    } catch {
      toast('Failed to regenerate response.', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeModeData = EXPERT_MODES.find((m) => m.id === activeMode);
  const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === 'assistant');
  const lastAssistantMsgId = lastAssistantIndex >= 0 ? messages[messages.length - 1 - lastAssistantIndex]?.id : null;

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-6 max-w-7xl mx-auto">
      {/* Sidebar - Expert Modes + History */}
      <div className="w-64 flex-shrink-0 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-4 overflow-y-auto hidden md:block">
        <button
          onClick={startNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity mb-4"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors mb-3 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          {showHistory ? 'Hide History' : 'Show History'}
          {conversations.length > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-xs">{conversations.length}</span>
          )}
        </button>

        {showHistory && conversations.length > 0 && (
          <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  activeConvId === conv.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {conv.title}
              </button>
            ))}
          </div>
        )}

        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Expert Modes</h2>
        <div className="space-y-1">
          {EXPERT_MODES.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border-l-2 ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-500/10 text-white'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5'}`}>
                  {modeIcons[mode.id]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mode.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              {modeIcons[activeMode]}
            </div>
            <div>
              <h2 className="font-semibold text-white">{activeModeData?.name}</h2>
              <p className="text-xs text-slate-400">{activeModeData?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-300">~{tokensUsed} tokens used</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`group flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[70%] ${message.role === 'assistant' ? 'relative' : ''}`}>
                <div
                  className={`rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                      : 'bg-white/5 border border-white/10 text-slate-200'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(message.content, message.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy"
                    >
                      {copiedId === message.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {message.id === lastAssistantMsgId && (
                      <button
                        onClick={handleRegenerate}
                        disabled={isTyping}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Regenerate"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          {/* Active mode badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-400 text-xs font-medium flex items-center gap-1">
              {modeIcons[activeMode]}
              {activeModeData?.name}
            </span>
            {suggestedMode && (
              <button
                onClick={() => setActiveMode(suggestedMode)}
                className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium animate-fade-in"
              >
                Switch to {EXPERT_MODES.find((m) => m.id === suggestedMode)?.name}? →
              </button>
            )}
          </div>
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything about your startup... (Ctrl+Enter to send)"
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none max-h-36"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
