"use client";

import { AGENTS, MODES, type Mode } from "@ghoul/agents/modes";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import {
  loadConversations,
  newConversation,
  saveConversations,
  type ChatMessage,
  type Conversation,
} from "@/lib/conversations";

const MODE_LABELS: Record<Mode, string> = {
  generar: "Generar",
  explicar: "Explicar",
  corregir: "Corregir",
  conversar: "Conversar",
};

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode | "auto">("auto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadConversations();
    const list = stored.length ? stored : [newConversation()];
    setConversations(list);
    setActiveId(list[0].id);
  }, []);

  useEffect(() => {
    if (conversations.length) saveConversations(conversations);
  }, [conversations]);

  const active = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  function update(id: string, fn: (c: Conversation) => Conversation) {
    setConversations((list) =>
      list.map((c) => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c)).sort((a, b) => b.updatedAt - a.updatedAt),
    );
  }

  function startNew() {
    const c = newConversation();
    setConversations((list) => [c, ...list]);
    setActiveId(c.id);
  }

  async function send() {
    const text = input.trim();
    if (!text || !active || busy) return;
    const id = active.id;
    const history: ChatMessage[] = [...active.messages, { role: "user", content: text }];

    setInput("");
    setError(undefined);
    setBusy(true);
    update(id, (c) => ({
      ...c,
      title: c.messages.length ? c.title : text.slice(0, 48),
      messages: [...history, { role: "assistant", content: "" }],
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          mode: mode === "auto" ? undefined : mode,
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al contactar a GHOUL.");
      }

      const agentMode = (res.headers.get("X-Ghoul-Mode") ?? undefined) as Mode | undefined;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        update(id, (c) => ({
          ...c,
          messages: [...history, { role: "assistant", content: reply, mode: agentMode }],
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      update(id, (c) => ({ ...c, messages: history }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-dvh">
      <aside className="hidden w-64 flex-col border-r border-border bg-panel md:flex">
        <div className="p-4 text-lg font-semibold tracking-wide">
          GHOUL <span className="text-accent">IA</span>
        </div>
        <button
          onClick={startNew}
          className="mx-3 mb-3 rounded-md border border-border px-3 py-2 text-left text-sm hover:border-accent"
        >
          + Nueva conversación
        </button>
        <nav className="flex-1 overflow-y-auto px-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`block w-full truncate rounded-md px-3 py-2 text-left text-sm ${
                c.id === activeId ? "bg-background text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {c.title}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {!active?.messages.length && (
              <div className="mt-24 text-center">
                <h1 className="text-3xl font-semibold">
                  GHOUL <span className="text-accent">IA</span>
                </h1>
                <p className="mt-2 text-muted">Pide código, pega un error o cuéntame tu idea.</p>
              </div>
            )}
            {active?.messages.map((m, i) => (
              <div key={i} className="mb-6">
                <div className="mb-1 text-xs text-muted">
                  {m.role === "user" ? "Tú" : m.mode ? AGENTS[m.mode].name : "GHOUL"}
                </div>
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap rounded-lg bg-panel px-4 py-3">{m.content}</div>
                ) : m.content ? (
                  <Markdown text={m.content} />
                ) : (
                  <div className="animate-pulse text-muted">Pensando…</div>
                )}
              </div>
            ))}
            <div ref={bottom} />
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="mx-auto max-w-3xl">
            {error && <div className="mb-2 text-sm text-red-400">{error}</div>}
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              {(["auto", ...MODES] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full border px-3 py-1 ${
                    mode === m ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {m === "auto" ? "Automático" : MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={3}
                placeholder="Escribe tu mensaje… (Shift+Enter para nueva línea)"
                className="flex-1 resize-none rounded-lg border border-border bg-panel px-3 py-2 outline-none focus:border-accent"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="rounded-lg bg-accent px-5 font-medium text-black disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
