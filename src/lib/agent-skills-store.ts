import { useEffect, useState, useSyncExternalStore } from "react";

export interface UploadedSkillFile {
  id: string;
  name: string;
  content: string;
  addedAt: number;
}

export interface AgentSkillLink {
  skillIds: string[];
  uploads: UploadedSkillFile[];
}

type Store = Record<string, AgentSkillLink>;

const KEY = "tp:agent-skills:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): Store {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

const listeners = new Set<() => void>();
let cache: Store | null = null;

function getSnapshot(): Store {
  if (cache) return cache;
  cache = read();
  return cache;
}

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: Store) {
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

const EMPTY: AgentSkillLink = { skillIds: [], uploads: [] };

export function useAgentSkills(agentId: string): AgentSkillLink {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const snap = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => ({}) as Store,
  );
  if (!hydrated) return EMPTY;
  return snap[agentId] ?? EMPTY;
}

function mutate(agentId: string, patch: (l: AgentSkillLink) => AgentSkillLink) {
  const store = read();
  const cur = store[agentId] ?? { skillIds: [], uploads: [] };
  store[agentId] = patch(cur);
  write(store);
}

export function attachSkill(agentId: string, skillId: string) {
  mutate(agentId, (l) =>
    l.skillIds.includes(skillId)
      ? l
      : { ...l, skillIds: [...l.skillIds, skillId] },
  );
}

export function detachSkill(agentId: string, skillId: string) {
  mutate(agentId, (l) => ({
    ...l,
    skillIds: l.skillIds.filter((id) => id !== skillId),
  }));
}

export function addUpload(agentId: string, name: string, content: string) {
  mutate(agentId, (l) => ({
    ...l,
    uploads: [
      ...l.uploads,
      {
        id: Math.random().toString(36).slice(2, 10),
        name,
        content,
        addedAt: Date.now(),
      },
    ],
  }));
}

export function removeUpload(agentId: string, uploadId: string) {
  mutate(agentId, (l) => ({
    ...l,
    uploads: l.uploads.filter((u) => u.id !== uploadId),
  }));
}
