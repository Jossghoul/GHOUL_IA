import type { Mode } from "@ghoul/agents/modes";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  mode?: Mode;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

// V1 guarda las conversaciones en el navegador; la base de datos llega en el siguiente paso.
const KEY = "ghoul:conversations";

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(conversations));
  } catch {
    // Sin almacenamiento disponible: la conversación sigue en memoria.
  }
}

export function newConversation(): Conversation {
  return { id: crypto.randomUUID(), title: "Nueva conversación", messages: [], updatedAt: Date.now() };
}
