import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Sparkles, Copy, Trash2, Pencil } from "lucide-react";
import { mockSkills } from "@/mock/data";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/skills")({
  head: () => ({
    meta: [
      { title: "Skills — TubePilot" },
      {
        name: "description",
        content: "Reusable AI instruction sets that power your workflow steps.",
      },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Skills</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Reusable AI instruction sets that power your workflow steps.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue hover:bg-blue/90 text-white px-3.5 h-9 text-[13px] font-medium">
          <Plus className="w-4 h-4" />
          New Skill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockSkills.map((s) => (
          <div
            key={s.id}
            className="rounded-xl bg-surface border border-subtle p-5 card-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue" />
                </div>
                <div className="text-[15px] font-semibold">{s.name}</div>
              </div>
              <span
                className={cn(
                  "text-[11px] uppercase tracking-wide rounded-md px-2 py-0.5 bg-raised text-text-secondary",
                )}
              >
                {s.category}
              </span>
            </div>
            <p className="text-[13px] text-text-secondary mt-3 line-clamp-2">
              {s.description}
            </p>
            <div className="text-[11px] text-text-tertiary mt-3 space-y-0.5">
              <div>Used in: {s.usedIn}</div>
              <div>Last edited: {s.lastEdited}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <Link
                to="/skills/$skillId"
                params={{ skillId: s.id }}
                className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover px-2.5 h-8 text-[13px]"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Link>
              <button className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover px-2.5 h-8 text-[13px]">
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover px-2.5 h-8 text-[13px] text-red">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
