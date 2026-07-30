import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Bir Agent Team içindeki tek bir node. Her node, mevcut Agents sayfasındaki
 * bir Workflow'a (agent'a) işaret eder (agentId, mockWorkflows'taki Workflow.id).
 */
export interface TeamNode {
  id: string;
  agentId: string;
  /** React Flow canvas üzerindeki pozisyon. */
  position: { x: number; y: number };
}

/**
 * İki node arasındaki bağlantı. condition, dallanma etiketini taşır
 * (ör. "Başarılı", "Hata", boş bırakılırsa koşulsuz/sıradaki adım).
 */
export interface TeamEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface AgentTeam {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  nodes: TeamNode[];
  edges: TeamEdge[];
}

const KEY = "tubepilot:agent-teams:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): AgentTeam[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AgentTeam[]) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: AgentTeam[] | null = null;

function getSnapshot(): AgentTeam[] {
  if (cache) return cache;
  cache = read();
  return cache;
}

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: AgentTeam[]) {
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

export function useAgentTeams(): AgentTeam[] {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => [] as AgentTeam[]);
  return hydrated ? snap : [];
}

export function useAgentTeam(id: string): AgentTeam | undefined {
  return useAgentTeams().find((t) => t.id === id);
}

export function getAgentTeam(id: string): AgentTeam | undefined {
  return read().find((t) => t.id === id);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function createAgentTeam(name = "Untitled team"): AgentTeam {
  const now = Date.now();
  const team: AgentTeam = {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    nodes: [],
    edges: [],
  };
  write([team, ...read()]);
  return team;
}

export function renameAgentTeam(id: string, name: string) {
  write(read().map((t) => (t.id === id ? { ...t, name, updatedAt: Date.now() } : t)));
}

export function deleteAgentTeam(id: string) {
  write(read().filter((t) => t.id !== id));
}

/** Node ve edge listesini tek seferde günceller (React Flow'un onNodesChange/onEdgesChange akışına uygun). */
export function updateTeamGraph(id: string, nodes: TeamNode[], edges: TeamEdge[]) {
  write(
    read().map((t) => (t.id === id ? { ...t, nodes, edges, updatedAt: Date.now() } : t)),
  );
}

export function addNodeToTeam(id: string, agentId: string, position: { x: number; y: number }): TeamNode {
  const node: TeamNode = { id: uid(), agentId, position };
  write(
    read().map((t) => (t.id === id ? { ...t, nodes: [...t.nodes, node], updatedAt: Date.now() } : t)),
  );
  return node;
}
