import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, HelpCircle, MapPin, TrendingDown, DollarSign, Users } from 'lucide-react';
import { Message } from '../types';

export default function CensusChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your Los Angeles County Census Equity Assistant, powered by automated US Census Bureau ACS estimates. Ask me anything about regional socioeconomic indicators, public transit commuter rates, vehicles per household, poverty prevalence, and how they correlate with our Transit Dependency Index (TDI) scores! 📊🏙️\n\nWhich neighborhood, municipal city, or county scale can we analyze together today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Demographics Suggestion chips
  const suggestionChips = [
    { label: "🏙️ High Transit Reliance", query: "Which geographies have the highest Transit Dependency Index (TDI) scores in LA County, and what are their poverty rates?" },
    { label: "🚗 Car Ownership vs Transit", query: "Show me the correlation between Average Vehicles per Household and Public Transit Commuter rates in municipal cities like long-beach and santa-monica." },
    { label: "💰 Westlake vs Torrance", query: "Compare Westlake (low income, high density) and Torrance (suburban) in terms of median household income, vehicles, and commuter transit usage." },
    { label: "📊 Geographies Summary Table", query: "Give me a summary table of all county, city, and neighborhood level geographies including population size, poverty, and TDI scores." }
  ];

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach AI assistant server.');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply || "I didn't receive a clear analytical breakdown. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        systemNotice: data.systemNotice
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error connecting to the census query engine. Error detail: ${error.message || 'Unknown network error'}. Please try again later.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col h-[420px]" id="census-chatbot-container">
      
      {/* Upper header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50 rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="bg-sky-600 text-white p-2 rounded-lg shadow">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white font-display">Socioeconomic & Equity Portal Agent</h3>
              <div className="bg-sky-950 text-sky-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                ACS INTEGRATION
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">US Census Bureau American Community Survey (ACS) estimates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-sky-400 rounded-full animate-ping"></span>
          <span className="text-[10px] text-slate-300 font-medium font-mono">ONLINE</span>
        </div>
      </div>

      {/* Suggestion Chips Panel */}
      <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex flex-wrap gap-2 text-xs" id="census-suggestions-wrap">
        <span className="text-[10px] text-slate-500 font-semibold uppercase font-sans flex items-center gap-1 w-full mb-1">
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> Suggested demographics queries
        </span>
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.query)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700/60 hover:border-sky-500 hover:bg-slate-800/85 text-slate-300 rounded-lg transition-all text-[11px] font-sans font-medium text-left shadow-sm truncate max-w-full"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Conversational Screen */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950" id="census-chat-messages-box">
        {messages.map((m, idx) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div
              key={idx}
              id={`census-chat-msg-${idx}`}
              className={`flex gap-3 max-w-[90%] ${isAssistant ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
            >
              <div className={`p-2 rounded-lg h-fit self-start shrink-0 ${
                isAssistant ? 'bg-slate-800 text-slate-300' : 'bg-sky-600 text-white'
              }`}>
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div className="flex flex-col gap-1 w-full">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isAssistant ? 'text-sky-400 ml-1' : 'text-slate-500 mr-1 text-right'}`}>
                  {isAssistant ? 'Assistant' : 'User'}
                </span>
                <div className={`rounded-2xl p-3.5 text-sm leading-relaxed shadow-md ${
                  isAssistant
                    ? m.systemNotice
                      ? 'bg-amber-950/40 border border-amber-900/50 text-amber-100'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-sm'
                    : 'bg-sky-600 text-white rounded-tr-sm border border-sky-500'
                }`}>
                  {m.systemNotice && (
                    <div className="flex items-center gap-2 mb-2 text-amber-200 font-bold text-xs bg-amber-950/80 p-2 rounded-lg border border-amber-800">
                      <span>Database Information Alert</span>
                    </div>
                  )}
                  <div className="prose prose-invert prose-xs max-w-full [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_table_th]:border [&_table_th]:border-slate-700 [&_table_th]:bg-slate-850 [&_table_th]:p-1.5 [&_table_td]:border [&_table_td]:border-slate-700 [&_table_td]:p-1.5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                    <ReactMarkdown>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <span className={`text-[9px] text-slate-500 ${isAssistant ? 'ml-1' : 'mr-1 text-right'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[90%] self-start" id="census-loading-bubble">
            <div className="p-2 bg-slate-800 text-slate-300 rounded-lg h-fit shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-sky-400 ml-1 uppercase tracking-widest">
                Agent Thinking...
              </span>
              <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>Interrogating LAC Community socioeconomic ACS dataset with equity analyzer...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 rounded-b-xl"
        id="census-chat-input-form"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a community equity or demographic correlation question..."
          className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-lg text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-sky-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:bg-slate-800 text-white p-2.5 rounded-lg transition-colors cursor-pointer"
          disabled={!input.trim() || isLoading}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
