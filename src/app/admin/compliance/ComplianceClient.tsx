'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Filter,
  User,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: string;
  content: string;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

interface Conversation {
  conversation_id: string;
  user_id: string;
  email: string;
  full_name: string;
  started_at: string;
  has_flagged: boolean;
  messages: Message[];
}

export function ComplianceClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async (onlyFlagged: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/compliance/conversations?flagged_only=${onlyFlagged}`);
      const data = await res.json();
      if (data.data?.conversations) {
        setConversations(data.data.conversations);
        if (data.data.conversations.length > 0) {
          setSelectedConv(data.data.conversations[0]);
        } else {
          setSelectedConv(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(flaggedOnly);
  }, [flaggedOnly]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/opportunities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Hub
          </Link>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-800" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Compliance Reviewer: AI Coach Logs
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 10.2 & 5.19 review panel. Auditing educational boundary compliance and vulnerability signposting.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 text-xs font-semibold self-start">
          <button
            onClick={() => setFlaggedOnly(false)}
            className={`px-3 py-1.5 rounded-xl transition ${
              !flaggedOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            All Conversations
          </button>
          <button
            onClick={() => setFlaggedOnly(true)}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              flaggedOnly
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Flagged Only</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Conversation List (Left) + Detail View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Conversation Sessions List */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-4 shadow-sm space-y-3">
          <div className="px-2 py-1 flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sessions ({conversations.length})
            </span>
            <span className="text-[11px] text-slate-400">Latest first</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading audit logs...</div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No {flaggedOnly ? 'flagged' : ''} conversations recorded yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto">
              {conversations.map((c) => {
                const isSelected = selectedConv?.conversation_id === c.conversation_id;
                return (
                  <button
                    key={c.conversation_id}
                    onClick={() => setSelectedConv(c)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                        : 'bg-stone-50/40 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {c.full_name || 'Anonymous User'}
                      </span>
                      {c.has_flagged && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Flagged</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono truncate max-w-[150px]">{c.email}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(c.started_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Conversation Transcript */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4 flex flex-col justify-between min-h-[500px]">
          {selectedConv ? (
            <>
              {/* Transcript Header */}
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Transcript: {selectedConv.full_name} ({selectedConv.email})
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedConv.conversation_id}
                  </p>
                </div>
                {selectedConv.has_flagged ? (
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                    Action Flagged
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Compliant</span>
                  </span>
                )}
              </div>

              {/* Message Transcript */}
              <div className="space-y-3 overflow-y-auto max-h-[460px] pr-2 text-xs">
                {selectedConv.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border ${
                      m.role === 'user'
                        ? 'bg-stone-50 border-stone-200 ml-6 text-slate-800'
                        : 'bg-emerald-50/40 border-emerald-200 mr-6 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                        {m.role === 'user' ? 'User Question' : 'Coach Response'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.created_at).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>

                    {m.flagged && (
                      <div className="mt-2.5 pt-2 border-t border-rose-200 bg-rose-50/80 p-2.5 rounded-xl text-rose-900 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block">Compliance Flag Triggered:</strong>
                          <span>{m.flag_reason || 'Vulnerability or output filter flag'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400">
              Select a conversation to review full transcript.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
