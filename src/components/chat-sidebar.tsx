"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  PenSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Clock,
  ChevronDown,
} from "lucide-react";

// ─── Types ───
export type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  messages: any[];
};

type GroupedSessions = {
  today: ChatSession[];
  yesterday: ChatSession[];
  lastWeek: ChatSession[];
  older: ChatSession[];
};

// ─── Helpers ───
const STORAGE_KEY = "nextrag-chat-sessions";

export function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function groupByDate(sessions: ChatSession[]): GroupedSessions {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const oneWeekAgo = new Date(startOfToday);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const groups: GroupedSessions = { today: [], yesterday: [], lastWeek: [], older: [] };

  for (const s of sessions) {
    const d = new Date(s.createdAt);
    if (d >= startOfToday) groups.today.push(s);
    else if (d >= startOfYesterday) groups.yesterday.push(s);
    else if (d >= oneWeekAgo) groups.lastWeek.push(s);
    else groups.older.push(s);
  }
  return groups;
}

// ─── Component ───
interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onDeleteAll: () => void;
  sessions: ChatSession[];
}

export function ChatSidebar({
  isOpen,
  onToggle,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onDeleteAll,
  sessions,
}: ChatSidebarProps) {
  const grouped = groupByDate(
    [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

  return (
    <>
      {/* Toggle button when sidebar is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={onToggle}
            className="fixed top-20 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all shadow-sm"
            title="Open sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 z-50 flex h-dvh w-[260px] flex-col border-r border-border/50 bg-card/95 backdrop-blur-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[13px] font-semibold text-foreground/80 tracking-tight">Chatbot</span>
                </div>
                <button
                  onClick={onToggle}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Close sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>

              {/* New Chat + Delete All */}
              <div className="px-2 pb-1 space-y-0.5">
                <button
                  onClick={onNewChat}
                  className="flex w-full items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  New chat
                </button>
                {sessions.length > 0 && (
                  <button
                    onClick={onDeleteAll}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete all
                  </button>
                )}
              </div>

              {/* History */}
              <div className="flex-1 overflow-y-auto px-2 pt-2 pb-3 space-y-3">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-8 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground/50 leading-relaxed px-4">
                      Riwayat percakapan Anda akan muncul di sini
                    </p>
                  </div>
                ) : (
                  <>
                    <HistoryGroup label="Today" items={grouped.today} activeId={activeSessionId} onSelect={onSelectSession} onDelete={onDeleteSession} />
                    <HistoryGroup label="Yesterday" items={grouped.yesterday} activeId={activeSessionId} onSelect={onSelectSession} onDelete={onDeleteSession} />
                    <HistoryGroup label="Last 7 days" items={grouped.lastWeek} activeId={activeSessionId} onSelect={onSelectSession} onDelete={onDeleteSession} />
                    <HistoryGroup label="Older" items={grouped.older} activeId={activeSessionId} onSelect={onSelectSession} onDelete={onDeleteSession} />
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border/40 px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground/40 text-center">
                  Integrated Halal Supply Chain KMS
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── History Group ───
function HistoryGroup({
  label,
  items,
  activeId,
  onSelect,
  onDelete,
}: {
  label: string;
  items: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map((session) => (
          <div
            key={session.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(session.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(session.id);
              }
            }}
            className={`group relative flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors cursor-pointer ${
              session.id === activeId
                ? "bg-muted/80 text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="truncate flex-1">{session.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
              className="absolute right-1.5 opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Delete chat"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
