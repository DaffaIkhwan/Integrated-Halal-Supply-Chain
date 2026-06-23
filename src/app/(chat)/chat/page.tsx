"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { tableComponents } from "@/components/markdown-table";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  RotateCcw,
  Trash2,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  ChatSidebar,
  type ChatSession,
  loadSessions,
  saveSessions,
} from "@/components/chat-sidebar";
import { TraceSummaryUI } from "@/components/trace-summary-ui";

// ─── Suggested Actions ───
const SUGGESTED_ACTIONS = [
  { label: "🔍 Cek Risiko Halal", prompt: "Tampilkan analisis risiko halal dari semua Critical Points" },
  { label: "🐄 Lacak Batch", prompt: "Lacak batch sapi TAG-A003 dan tampilkan status compliance-nya" },
  { label: "📋 Panduan Sembelih", prompt: "Jelaskan prosedur penyembelihan halal yang sesuai syariah Islam" },
  { label: "📊 Bobot CP", prompt: "Tampilkan bobot Fuzzy AHP untuk setiap Critical Point" },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  // ─── Sidebar State ───
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const traceParam = searchParams.get("trace");
  const [traceTriggered, setTraceTriggered] = useState(false);
  const [traceData, setTraceData] = useState<any>(null);
  const [isLoadingTrace, setIsLoadingTrace] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    setMessages,
    error,
  } = useChat({ api: "/api/chat" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showGreeting, setShowGreeting] = useState(true);

  // ─── QR Code Deep Link: Auto-trigger trace ───
  useEffect(() => {
    if (traceParam && !traceTriggered && !isLoading) {
      setTraceTriggered(true);

      // Clear ?trace= from URL to prevent re-trigger
      const url = new URL(window.location.href);
      url.searchParams.delete("trace");
      window.history.replaceState({}, "", url.pathname);

      // Fetch trace data FIRST, then use ear tag for comprehensive prompt
      setIsLoadingTrace(true);
      fetch(`/api/trace/${traceParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) setTraceData(data);

          // Use ear tag from fetched data for better RAG results
          const earTag = data?.earTag || traceParam;
          const tracePrompt = `Lacak batch sapi ${earTag} dan tampilkan informasi lengkap meliputi: Batch ID, tanggal produksi, total halal compliance risk score, asal ternak (farm), jenis sapi, RPH, rekaman kepatuhan SEMUA Critical Point (CP1-CP9) beserta risk score, global weighted risk, dan sub-CP dengan risiko tertinggi, data personel & info operasional setiap CP (nama petugas, supervisor, nomor kendaraan, sertifikat, suhu, dll), serta rekomendasi perbaikan.`;

          // Create a new session for this trace
          const newSession: ChatSession = {
            id: generateId(),
            title: `Lacak ${earTag}`,
            createdAt: new Date().toISOString(),
            messages: [],
          };
          setSessions((prev) => {
            const updated = [newSession, ...prev];
            saveSessions(updated);
            return updated;
          });
          setActiveSessionId(newSession.id);
          setShowGreeting(false);

          // Trigger the message with comprehensive prompt
          handleInputChange({
            target: { value: tracePrompt },
          } as React.ChangeEvent<HTMLTextAreaElement>);

          setTimeout(() => {
            handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
          }, 100);
        })
        .catch(console.error)
        .finally(() => setIsLoadingTrace(false));
    }
  }, [traceParam, traceTriggered, isLoading, handleInputChange, handleSubmit]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Hide greeting when messages exist
  useEffect(() => {
    if (messages.length > 0) setShowGreeting(false);
  }, [messages]);

  // ─── Persist messages to localStorage whenever they change ───
  useEffect(() => {
    if (messages.length === 0 || !activeSessionId) return;

    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === activeSessionId) {
          // Update title from first user message if it's still "New Chat"
          const firstUserMsg = messages.find((m) => m.role === "user");
          const title =
            s.title === "New Chat" && firstUserMsg
              ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "")
              : s.title;
          return { ...s, title, messages };
        }
        return s;
      });
      saveSessions(updated);
      return updated;
    });
  }, [messages, activeSessionId]);

  // ─── Sidebar Handlers ───
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setActiveSessionId(null);
    setShowGreeting(true);
  }, [setMessages]);

  const handleSelectSession = useCallback(
    (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        setMessages(session.messages);
        setActiveSessionId(id);
        setShowGreeting(false);
      }
      // Close sidebar on mobile
      if (window.innerWidth < 768) setSidebarOpen(false);
    },
    [sessions, setMessages]
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== id);
        saveSessions(filtered);
        return filtered;
      });
      if (activeSessionId === id) {
        setMessages([]);
        setActiveSessionId(null);
        setShowGreeting(true);
      }
    },
    [activeSessionId, setMessages]
  );

  const handleDeleteAll = useCallback(() => {
    setSessions([]);
    saveSessions([]);
    setMessages([]);
    setActiveSessionId(null);
    setShowGreeting(true);
  }, [setMessages]);

  // ─── Create a new session when user sends first message ───
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: generateId(),
        title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
        createdAt: new Date().toISOString(),
        messages: [],
      };
      setSessions((prev) => {
        const updated = [newSession, ...prev];
        saveSessions(updated);
        return updated;
      });
      setActiveSessionId(newSession.id);
    }

    handleSubmit(e);
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleFormSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  const handleSuggestion = (prompt: string) => {
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: generateId(),
        title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
        createdAt: new Date().toISOString(),
        messages: [],
      };
      setSessions((prev) => {
        const updated = [newSession, ...prev];
        saveSessions(updated);
        return updated;
      });
      setActiveSessionId(newSession.id);
    }

    handleInputChange({
      target: { value: prompt },
    } as React.ChangeEvent<HTMLTextAreaElement>);

    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onDeleteAll={handleDeleteAll}
        sessions={sessions}
      />

      {/* Chat Container — shifts right when sidebar is open on desktop */}
      <div
        className="flex-1 flex flex-col max-w-3xl mx-auto w-full"
      >
        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-1"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Trace Summary UI injected for Deep Links */}
          {isLoadingTrace && (
            <div className="w-full flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            </div>
          )}
          {traceData && !isLoadingTrace && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <TraceSummaryUI data={traceData} />
            </motion.div>
          )}

          {/* Greeting */}
          <AnimatePresence>
            {showGreeting && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center pt-[15vh]"
              >
               

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-semibold tracking-tight text-center md:text-3xl"
                >
                  Integrated Halal Supply Chain KMS
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-2 text-center text-muted-foreground text-sm max-w-md"
                >
                  Tanya tentang kehalalan, lacak batch, atau analisis risiko supply chain
                </motion.p>

                {/* Suggestions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-2 gap-2 mt-8 w-full max-w-lg"
                >
                  {SUGGESTED_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSuggestion(action.prompt)}
                      className="text-left px-4 py-3 rounded-xl border border-border/60 bg-card/50 hover:bg-muted/80 hover:border-border transition-all text-sm text-muted-foreground hover:text-foreground group"
                    >
                      <span className="group-hover:translate-x-0.5 inline-block transition-transform">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {messages.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`group/message w-full py-3`}
              data-role={m.role}
            >
              {m.role === "user" ? (
                /* ── User Message ── */
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-end gap-2.5">
                    <div className="max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-4 py-2.5 shadow-sm">
                      <p className="text-[13px] leading-[1.65] whitespace-pre-wrap">
                        {m.content}
                      </p>
                    </div>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-border/50">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Assistant Message ── */
                <div className="flex items-start gap-3">
                  <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Tool invocations */}
                    {(m as any).toolInvocations?.map((tool: any, ti: number) => (
                      <div key={ti} className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-3 rounded-lg bg-muted/40 border border-border/30">
                        {tool.state === "result" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                        )}
                        <span className="font-mono font-semibold">{tool.toolName}</span>
                        <span className="text-muted-foreground/60">
                          {tool.state === "result" ? "✓ selesai" : "sedang memproses..."}
                        </span>
                      </div>
                    ))}

                    {/* Text content */}
                    {m.content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-[1.65]
                        prose-headings:font-semibold prose-headings:tracking-tight
                        prose-p:text-foreground/90
                        prose-strong:text-foreground prose-strong:font-semibold
                        prose-code:text-[12px] prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono
                        prose-pre:bg-[#1e1e2e] prose-pre:border prose-pre:border-border/30 prose-pre:rounded-xl prose-pre:shadow-sm
                        prose-ul:my-2 prose-li:my-0.5
                        prose-a:text-cyan-500 prose-a:no-underline hover:prose-a:underline
                      ">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            ...tableComponents,
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              return match ? (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    margin: 0,
                                    borderRadius: "0.75rem",
                                    fontSize: "12px",
                                  }}
                                  {...(props as SyntaxHighlighterProps)}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : !((m as any).toolInvocations?.length > 0) ? (
                      <div className="flex h-[calc(13px*1.65)] items-center">
                        <span className="text-[13px] text-muted-foreground animate-pulse font-medium">
                          Thinking...
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 py-3"
            >
              <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex h-[calc(13px*1.65)] items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 py-3"
            >
              <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500 ring-1 ring-red-500/50">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="min-w-0 flex-1 max-w-[80%]">
                <div className="rounded-2xl rounded-bl-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 shadow-sm text-[13px] text-red-600 dark:text-red-400">
                  <span className="font-semibold block mb-1">Pesan Sistem:</span>
                  {error.message}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Composer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-6 px-4">
          {/* Actions bar */}
          {messages.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={() => reload()}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted disabled:opacity-30"
              >
                <RotateCcw className="h-3 w-3" /> Regenerate
              </button>
              <button
                onClick={() => { setMessages([]); setShowGreeting(true); setActiveSessionId(null); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="relative">
            <div className="relative flex items-end rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_8px_-2px_rgba(0,0,0,0.06)] focus-within:border-border transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Tanya tentang kehalalan supply chain..."
                rows={1}
                className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground/60 max-h-[200px]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="m-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-[11px] text-muted-foreground/50 mt-2.5">
            Integrated Halal Supply Chain KMS — Powered by Fuzzy AHP & RAG
          </p>
        </div>
      </div>
    </div>
  );
}
