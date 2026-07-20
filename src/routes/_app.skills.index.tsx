import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Pencil, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { mockSkills, type Skill } from "@/mock/data";

export const Route = createFileRoute("/_app/skills/")({
  head: () => ({
    meta: [
      { title: "Skills — TubePilot" },
      {
        name: "description",
        content: "Reusable AI instruction sets that power your agent steps.",
      },
    ],
  }),
  component: SkillsPage,
});

const categoryAccent: Record<string, string> = {
  Music: "#f7b6d2",
  Documentary: "#facc15",
  Education: "#c6f24a",
};

function accentFor(cat: string) {
  return categoryAccent[cat] ?? "var(--tp-subtle)";
}

function SkillsPage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return mockSkills;
    return mockSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(n) ||
        s.description.toLowerCase().includes(n) ||
        s.category.toLowerCase().includes(n),
    );
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-semibold tracking-tight">Skills</h1>
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
        <h2 className="text-[15px] font-semibold mb-3">Your skills</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((s) => (
            <SkillCard key={s.id} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillCard({ s }: { s: Skill }) {
  const accent = accentFor(s.category);
  return (
    <div
      className="rounded-xl bg-surface overflow-hidden card-shadow transition-transform hover:-translate-y-0.5"
      style={{ border: `2px solid ${accent}` }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
          style={{ backgroundColor: accent }}
        >
          <Sparkles className="w-4 h-4 text-black/70" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-text-primary truncate">
            {s.name}
          </div>
          <div className="text-[11px] text-text-tertiary truncate">
            {s.category} · {s.lastEdited}
          </div>
        </div>
      </div>

      <p className="px-4 mt-2 text-[12px] text-text-secondary line-clamp-2">
        {s.description}
      </p>

      <div className="mt-4 border-t border-subtle bg-raised/40 flex items-center justify-between px-2 py-1.5">
        <Link
          to="/skills/$skillId"
          params={{ skillId: s.id }}
          className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-2.5 h-7 text-[12px] font-medium"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </Link>
        <Link
          to="/skills/$skillId"
          params={{ skillId: s.id }}
          className="inline-flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary px-1.5 h-7"
        >
          Open <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}