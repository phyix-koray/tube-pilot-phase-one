import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Play, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  mockVideos,
  mockWorkflows,
  statusLeftBorder,
  type Workflow,
} from "@/mock/data";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/agents")({
  head: () => ({
    meta: [
      { title: "Agents — TubePilot" },
      {
        name: "description",
        content: "Your AI agents that produce and publish videos on autopilot.",
      },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const [q, setQ] = useState("");
  const pending = mockVideos.filter((v) => v.status === "pending_review");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return mockWorkflows;
    return mockWorkflows.filter(
      (w) =>
        w.name.toLowerCase().includes(needle) ||
        w.description.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-[13px]">
          <span className="text-amber">
            {pending.length} video{pending.length > 1 ? "s" : ""} awaiting your
            review before publishing.
          </span>
          <Link to="/videos" className="text-amber font-medium hover:underline">
            Review now →
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight">Agents</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="h-9 w-64 rounded-lg bg-surface border border-subtle pl-8 pr-3 text-[13px] placeholder:text-text-tertiary"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium">
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-text-primary mb-3">
          Your agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <AgentCard key={w.id} w={w} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentCard({ w }: { w: Workflow }) {
  const accent = w.accent ?? "var(--tp-subtle)";
  return (
    <div
      className={cn(
        "group rounded-xl bg-surface overflow-hidden card-shadow transition-transform hover:-translate-y-0.5",
        statusLeftBorder(w.status),
      )}
      style={{ border: `2px solid ${accent}` }}
    >
      {/* Hero row: avatar + name */}
      <div className="flex items-center gap-3 px-5 pt-5">
        <div
          className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{ backgroundColor: accent }}
        >
          {w.avatar ? (
            <img
              src={w.avatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-text-primary truncate">
            {w.name}
          </div>
          <div className="text-[11px] text-text-tertiary">
            {w.steps.length} steps · Last run: {w.lastRun ?? "—"}
          </div>
        </div>
      </div>

      <p className="px-5 mt-3 text-[13px] text-text-secondary line-clamp-2">
        {w.description}
      </p>

      <div className="mt-5 border-t border-subtle bg-raised/40 flex items-center justify-between px-3 py-2">
        <button className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3 h-8 text-[13px] font-medium">
          <Play className="w-3.5 h-3.5" />
          Use agent
        </button>
        <Link
          to="/agents/$agentId"
          params={{ agentId: w.id }}
          className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary px-2 h-8"
        >
          Configure <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
