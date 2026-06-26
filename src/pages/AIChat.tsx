import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
}

interface ExpertMode {
  id: string;
  name: string;
  icon: React.ReactNode;
  triggers: string[];
  description: string;
}

const expertModes: ExpertMode[] = [
  { id: 'founder', name: 'Founder AI', icon: <Brain className="w-4 h-4" />, triggers: [], description: 'Cross-domain founder advice' },
  { id: 'code', name: 'Code Expert', icon: <Code className="w-4 h-4" />, triggers: ['code', 'bug', 'typescript'], description: 'Full-stack engineering' },
  { id: 'seo', name: 'SEO Expert', icon: <Search className="w-4 h-4" />, triggers: ['seo', 'keywords', 'ranking'], description: 'Technical SEO & content' },
  { id: 'security', name: 'Security Expert', icon: <Shield className="w-4 h-4" />, triggers: ['vulnerability', 'xss', 'auth'], description: 'OWASP & pen-testing' },
  { id: 'data', name: 'Data Analyst', icon: <BarChart3 className="w-4 h-4" />, triggers: ['metrics', 'kpi', 'mrr'], description: 'Analytics & visualization' },
  { id: 'research', name: 'Research Expert', icon: <Microscope className="w-4 h-4" />, triggers: ['competitor', 'market', 'trend'], description: 'Market research' },
  { id: 'finance', name: 'Finance Expert', icon: <DollarSign className="w-4 h-4" />, triggers: ['revenue', 'burn', 'fundraising'], description: 'SaaS metrics & fundraising' },
  { id: 'product', name: 'Product Expert', icon: <Puzzle className="w-4 h-4" />, triggers: ['roadmap', 'ux', 'sprint'], description: 'Product management' },
  { id: 'startup', name: 'Startup Advisor', icon: <Rocket className="w-4 h-4" />, triggers: ['strategy', 'gtm', 'scale'], description: 'YC-style advice' },
];

export default function AIChat() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        founder: "Looking at your current trajectory, I'd recommend focusing on customer acquisition before scaling. Your conversion rate of 3.2% has room for improvement. Let's dive into specific strategies...",
        code: "I've analyzed your code structure. For better maintainability, consider implementing a repository pattern for your data layer. This will decouple your business logic from the database implementation.",
        seo: "Based on your target keywords, I recommend creating topic clusters around 'startup tools' and 'founder productivity'. Your current content gap shows opportunity in how-to guides.",
        security: "I've identified 3 potential vulnerabilities in your auth flow. The main concern is CSRF token validation. Here's a fix: implement double-submit cookie pattern...",
        data: "Your MRR growth rate of 12.5% is solid for this stage. Churn analysis shows most users leave after month 3. Recommend implementing onboarding improvements.",
        research: "Market analysis shows your competitors are pricing 20% higher on average. There's an opportunity to capture the budget-conscious segment while maintaining quality positioning.",
        finance: "With a current burn rate of $8,500/month and 14 months runway, you're in a healthy position. Consider raising when you hit $20K MRR for better terms.",
        product: "Your roadmap looks solid. I'd recommend moving the analytics feature earlier - users have been requesting it and it directly impacts retention.",
        startup: "Your go-to-market strategy needs refinement. Focus on a single channel first, validate with 100 customers, then expand. Don't spread too thin.",
      };

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[activeMode] || responses.founder,
        mode: activeMode,
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const activeModeData = expertModes.find((m) => m.id === activeMode);

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-6 max-w-7xl mx-auto">
      {/* Sidebar - Expert Modes */}
      <div className="w-64 flex-shrink-0 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Expert Modes</h2>
        <div className="space-y-1">
          {expertModes.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5'}`}>
                  {mode.icon}
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
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            {activeModeData?.icon}
          </div>
          <div>
            <h2 className="font-semibold text-white">{activeModeData?.name}</h2>
            <p className="text-xs text-slate-400">{activeModeData?.description}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'bg-white/5 border border-white/10 text-slate-200'
                }`}
              >
                <p className="leading-relaxed">{message.content}</p>
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
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your startup..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
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
