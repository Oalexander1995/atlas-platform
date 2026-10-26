'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Coins, AlertCircle, Info, Sparkles } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/v1/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await fetch('/api/v1/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-900/40 transition"
        aria-label="View notifications"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#031c13] text-white rounded-3xl shadow-2xl border border-emerald-500/30 p-4 z-50 text-xs animate-in fade-in slide-in-from-top-1"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-emerald-300 hover:text-emerald-200 font-medium text-[11px] flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-emerald-300/60">
                <p>No notifications yet</p>
                <p className="text-[10px] text-emerald-300/40 mt-1">
                  Updates on repayments, auto-invest and projects will appear here
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    onClick={() => isUnread && handleMarkAsRead(n.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer ${
                      isUnread
                        ? 'bg-emerald-950/70 border-emerald-500/40 text-white'
                        : 'bg-white/5 border-white/10 text-emerald-100/70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {n.type === 'repayment' ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                            <Coins className="w-3.5 h-3.5" />
                          </div>
                        ) : n.type === 'default' ? (
                          <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-stone-700 text-white flex items-center justify-center">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString('en-GB', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
