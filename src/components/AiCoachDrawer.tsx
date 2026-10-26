'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  flagged?: boolean;
}

export function AiCoachDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your Atlas Coach. I can help explain investing concepts (like risk tiers, diversification, and interest), describe facts about your current holdings, or explain how features like Auto-Invest and the Provision Fund work. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/coach/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          conversation_id: conversationId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Coach request failed');

      if (data.data.conversationId && !conversationId) {
        setConversationId(data.data.conversationId);
      }

      const botMsg: Message = {
        id: `b_${Date.now()}`,
        role: 'assistant',
        content: data.data.message,
        flagged: data.data.flagged,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content:
            "I'm sorry, I encountered a temporary connection error. Please feel free to try again or check our Learning Hub.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What's diversification?",
    'How does the Provision Fund work?',
    'How much do I have in High tier?',
    'Which opportunity should I put £100 in?',
  ];

  return (
    <>
      {/* Floating Toggle Button (Section 7) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-2.5 transition transform hover:scale-105 border border-emerald-600 focus:outline-none"
          aria-label="Open Atlas Coach"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-xs tracking-wide">Ask Atlas Coach</span>
        </button>
      )}

      {/* Slide-Up / Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-emerald-800 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm leading-none">Atlas Coach</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <span className="text-[10px] text-emerald-200 mt-0.5 block">
                  Guidance Only • Not Personal Advice
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              aria-label="Close Coach"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Regulatory Disclaimer Ribbon */}
          <div className="bg-emerald-50/80 border-b border-emerald-100 px-3 py-1.5 text-[10px] text-emerald-900 flex items-center gap-1.5">
            <Info className="w-3 h-3 text-emerald-700 flex-shrink-0" />
            <span>Provides financial education & holdings facts. Cannot recommend investments.</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                    A
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-xs'
                      : 'bg-stone-100 text-slate-800 rounded-tl-xs border border-stone-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.flagged && (
                    <div className="mt-2 pt-2 border-t border-amber-200 text-[10px] text-amber-900 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        Note: This message flagged support resources (e.g. MoneyHelper or GamCare).
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs italic py-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                <span>Atlas Coach is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (if only 1 or 2 messages) */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 border-t border-stone-100 bg-stone-50/60 overflow-x-auto flex gap-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="px-2.5 py-1 bg-white border border-stone-200 hover:border-emerald-300 rounded-full text-[10px] text-slate-600 whitespace-nowrap transition"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 border-t border-stone-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about risk, diversification, or your loans..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl transition"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
