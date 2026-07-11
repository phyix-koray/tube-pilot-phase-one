import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Music,
  Film,
  BookOpen,
  Trophy,
  ChevronRight,
  Play,
  Layers,
} from "lucide-react";
import {
  mockWorkflows,
  mockVideos,
  categoryClass,
  statusLeftBorder,
  type Workflow,
} from "@/mock/data";
import { cn } from "@/lib/tp";

const iconMap = { Music, Film, BookOpen, Trophy } as const;

export const Route = createFileRoute("/_app/library")({
  head: () => ({
    meta: [
      { title: "Library — TubePilot" },
      {
        name: "description",
        content: "Browse and run your automated video workflows.",
      },
    ],
  }),
  component: LibraryPage,
});

const cats = [
  "All",
  "Music",
  "Documentary",
  "Education",
  "Sports",
  "Custom",
] as const;

function LibraryPage() {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const pending = mockVideos.filter((v) => v.status === "pending_review");

  const filtered = useMemo(
    () =>
      mockWorkflows.filter(
        (w) => cat === "All" || w.category === cat.toLowerCase(),
      ),
    [cat],
  );

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

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Library</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Your automation modules
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue hover:bg-blue/90 text-white px-3.5 h-9 text-[13px] font-medium">
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "px-3 h-7 rounded-md text-[13px] border transition-colors",
              cat === c
                ? "bg-raised text-text-primary border-subtle"
                : "border-transparent text-text-secondary hover:text-text-primary hover:bg-hover",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((w) => (
          <WorkflowCard key={w.id} w={w} />
        ))}

        <button className="flex flex-col items-center justify-center min-h-[220px] rounded-xl border border-dashed border-subtle text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors">
          <Layers className="w-6 h-6 mb-2" />
          <span className="text-[13px]">Create Custom Workflow</span>
        </button>
      </div>
    </div>
  );
}

function WorkflowCard({ w }: { w: Workflow }) {
  const Icon = (iconMap[w.icon as keyof typeof iconMap] ?? Music);
  return (
    <div
      className={cn(
        "group rounded-xl bg-surface border border-subtle p-5 card-shadow transition-transform hover:-translate-y-0.5",
        statusLeftBorder(w.status),
      )}
    >
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center">
          <Icon className="w-4 h-4 text-text-primary" />
        </div>
        <span
          className={cn(
            "text-[11px] font-medium uppercase tracking-wide rounded-md px-2 py-0.5",
            categoryClass(w.category),
          )}
        >
          {w.category}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-[15px] font-semibold text-text-primary">
          {w.name}
        </div>
        <p className="text-[13px] text-text-secondary mt-1 line-clamp-2">
          {w.description}
        </p>
      </div>

      <div className="my-4 h-px bg-subtle" />

      <div className="flex items-center justify-between text-[13px] text-text-secondary">
        <span>{w.steps.length} steps</span>
        <span>Last run: {w.lastRun ?? "—"}</span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button className="inline-flex items-center gap-1.5 rounded-md bg-blue hover:bg-blue/90 text-white px-3 h-8 text-[13px] font-medium">
          <Play className="w-3.5 h-3.5" />
          Run Now
        </button>
        <Link
          to="/library/$workflowId"
          params={{ workflowId: w.id }}
          className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary"
        >
          Configure <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
