import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, AlertCircle, HelpCircle, Terminal } from 'lucide-react';
import { Message } from '../types';

interface ChatbotProps {
  selectedAgencyId: string;
  selectedMonth: string;
}

export default function Chatbot({ selectedAgencyId, selectedMonth }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your SCal Transit AI Consultant, connected directly to our FTA National Transit Database. Ask me whatever you'd like about UPT, VRM, VRH statistics, monthly growth rates, or comparison trends across transit agencies in Southern California! 🚌🚆\n\nHow can I help you analyze the transit landscape today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestions chips
  const suggestionChips = [
    { label: "📊 Regional Leader?", query: "Which transit agency has the absolute highest monthly ridership (UPT) and what are its numbers in early 2026?" },
    { label: "🤝 Compare LACMTA vs OCTA", query: "Can you list and compare the UPT, VRM, and VRH for LA Metro and OCTA in October 2025?" },
    { label: "📈 San Diego Growth", query: "Give me an overview of San Diego MTS's performance stats. What is their general trend from 2010 to 2026?" },
    { label: "⏱️ Commuter vs City Bus", query: "Compare Metrolink (commuter rail) and Santa Monica Big Blue Bus in terms of Vehicle Revenue Hours (VRH) and Unlinked Passenger Trips (UPT)." }
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
        content: `Sorry, I encountered an error connecting to the transit query engine. Error detail: ${error.message || 'Unknown network error'}. Please try again later.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col h-[480px]" id="chatbot-container">
      
      {/* Upper header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50 rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white font-display">NTD Insights Agent</h3>
              <div className="bg-blue-950 text-blue-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                AI CO-PILOT
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">Federal Transit Administration Datasets</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></span>
          <span className="text-[10px] text-slate-300 font-medium font-mono">ONLINE</span>
        </div>
      </div>

      {/* Suggestion Chips Panel */}
      <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex flex-wrap gap-2 text-xs" id="suggestions-wrap">
        <span className="text-[10px] text-slate-500 font-semibold uppercase font-sans flex items-center gap-1 w-full mb-1">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> Suggested queries
        </span>
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.query)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700/60 hover:border-blue-500 hover:bg-slate-800/85 text-slate-300 rounded-lg transition-all text-[11px] font-sans font-medium text-left shadow-sm truncate max-w-full"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Conversational Screen */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950" id="chat-messages-box">
        {messages.map((m, idx) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div
              key={idx}
              id={`chat-msg-${idx}`}
              className={`flex gap-3 max-w-[90%] ${isAssistant ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
            >
              <div className={`p-2 rounded-lg h-fit self-start shrink-0 ${
                isAssistant ? 'bg-slate-800 text-slate-300' : 'bg-blue-600 text-white'
              }`}>
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div className="flex flex-col gap-1 w-full">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isAssistant ? 'text-blue-400 ml-1' : 'text-slate-500 mr-1 text-right'}`}>
                  {isAssistant ? 'Assistant' : 'User'}
                </span>
                <div className={`rounded-2xl p-3.5 text-sm leading-relaxed shadow-md ${
                  isAssistant
                    ? m.systemNotice
                      ? 'bg-amber-950/40 border border-amber-900/50 text-amber-100'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm border border-blue-500'
                }`}>
                  {m.systemNotice && (
                    <div className="flex items-center gap-2 mb-2 text-amber-200 font-bold text-xs bg-amber-950/80 p-2 rounded-lg border border-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Interactive Sandbox Preview Mode</span>
                    </div>
                  )}
                  
                  <div className={`markdown-body font-sans break-words prose prose-sm max-w-none ${isAssistant ? 'prose-invert text-slate-200' : 'text-white'}`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
                
                <span className={`text-[9px] text-slate-500 font-mono ${isAssistant ? 'self-start' : 'self-end'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[90%] self-start" id="chat-loading-status">
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300 h-fit">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Assistant</span>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-1.5 shadow-md text-xs text-slate-300 font-medium font-sans">
                <Terminal className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                <span>compiling relational transit metrics...</span>
                <span className="flex gap-1 ml-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Form Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 rounded-b-xl"
        id="chatbot-input-form"
      >
        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a data question (e.g. Compare LA Metro and OCTA)..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none text-white text-sm px-3 focus:outline-none focus:ring-0 placeholder-slate-500 disabled:opacity-50"
            id="chat-text-input-field"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-750 text-white rounded-md transition-all shadow-md cursor-pointer shrink-0"
            id="chat-send-submit-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
