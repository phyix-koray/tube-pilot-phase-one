import { useEffect, useState, useSyncExternalStore } from "react";

export interface SkillMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface SkillAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  ts: number;
}

export interface SkillDoc {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  messages: SkillMessage[];
  attachments?: SkillAttachment[];
  /** current skill file (markdown) — grows as the user chats */
  file: string;
}

const KEY = "tp:skills:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): SkillDoc[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SkillDoc[]) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: SkillDoc[] | null = null;

function getSnapshot(): SkillDoc[] {
  if (cache) return cache;
  cache = read();
  return cache;
}

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: SkillDoc[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useSkills(): SkillDoc[] {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const snap = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => [] as SkillDoc[],
  );
  return hydrated ? snap : [];
}

export function useSkill(id: string): SkillDoc | undefined {
  return useSkills().find((s) => s.id === id);
}

export function getSkill(id: string): SkillDoc | undefined {
  return read().find((s) => s.id === id);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function createSkill(name = "Untitled skill"): SkillDoc {
  const now = Date.now();
  const skill: SkillDoc = {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    messages: [],
    attachments: [],
    file: "",
  };
  write([skill, ...read()]);
  return skill;
}

export function deleteSkill(id: string) {
  write(read().filter((s) => s.id !== id));
}

export function duplicateSkill(id: string): SkillDoc | null {
  const src = read().find((s) => s.id === id);
  if (!src) return null;
  const now = Date.now();
  const copy: SkillDoc = {
    ...src,
    id: uid(),
    name: `${src.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  write([copy, ...read()]);
  return copy;
}

export function renameSkill(id: string, name: string) {
  const list = read().map((s) =>
    s.id === id ? { ...s, name, updatedAt: Date.now() } : s,
  );
  write(list);
}

export function setSkillDescription(id: string, description: string) {
  const list = read().map((s) =>
    s.id === id ? { ...s, description, updatedAt: Date.now() } : s,
  );
  write(list);
}

export function updateSkillFile(id: string, file: string) {
  const list = read().map((s) =>
    s.id === id ? { ...s, file, updatedAt: Date.now() } : s,
  );
  write(list);
}

export function appendMessage(id: string, msg: Omit<SkillMessage, "id" | "ts">) {
  const list = read().map((s) => {
    if (s.id !== id) return s;
    const message: SkillMessage = {
      id: uid(),
      ts: Date.now(),
      ...msg,
    };
    return { ...s, messages: [...s.messages, message], updatedAt: Date.now() };
  });
  write(list);
}

export function addAttachment(
  id: string,
  attachment: Omit<SkillAttachment, "id" | "ts">,
) {
  const list = read().map((s) => {
    if (s.id !== id) return s;
    const nextAttachment: SkillAttachment = {
      id: uid(),
      ts: Date.now(),
      ...attachment,
    };
    return {
      ...s,
      attachments: [...(s.attachments ?? []), nextAttachment],
      updatedAt: Date.now(),
    };
  });
  write(list);
}

export function removeAttachment(id: string, attachmentId: string) {
  const list = read().map((s) => {
    if (s.id !== id) return s;
    return {
      ...s,
      attachments: (s.attachments ?? []).filter((a) => a.id !== attachmentId),
      updatedAt: Date.now(),
    };
  });
  write(list);
}

export function removeLegacyMockMessages(id: string) {
  const legacyMock =
    "Understood. I've updated your skill file with these rules and kept everything in one clean document. Open the file preview on the right to review.";
  const list = read().map((s) => {
    if (s.id !== id) return s;
    const messages = s.messages.filter(
      (m) => !(m.role === "assistant" && m.content.trim() === legacyMock),
    );
    if (messages.length === s.messages.length) return s;
    return { ...s, messages, updatedAt: Date.now() };
  });
  write(list);
}
