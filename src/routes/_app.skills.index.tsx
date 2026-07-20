import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Copy,
  Trash2,
  Settings2,
  Pencil,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createSkill,
  deleteSkill,
  duplicateSkill,
  renameSkill,
  setSkillDescription,
  useSkills,
  type SkillDoc,
} from "@/lib/skills-store";

export const Route = createFileRoute("/_app/skills/")({
  head: () => ({
    meta: [
      { title: "Skills — TubePilot" },
      {
        name: "description",
        content: "Reusable AI skill files built through chat.",
      },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const [q, setQ] = useState("");
  const skills = useSkills();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return skills;
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(n) ||
        s.file.toLowerCase().includes(n),
    );
  }, [q, skills]);

  const onNew = () => {
    const s = createSkill("New skill");
    navigate({ to: "/skills/$skillId", params: { skillId: s.id } });
  };

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
          <button
            onClick={onNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState onNew={onNew} hasQuery={q.length > 0} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((s) => (
            <SkillCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNew, hasQuery }: { onNew: () => void; hasQuery: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-subtle bg-surface/60 py-16 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-raised flex items-center justify-center mb-4">
        <Sparkles className="w-5 h-5 text-text-secondary" />
      </div>
      <div className="text-[15px] font-semibold text-text-primary">
        {hasQuery ? "No matching skills" : "No skills yet"}
      </div>
      <p className="mt-1 text-[13px] text-text-secondary max-w-sm">
        Skills are reusable AI instruction files. Create one and shape it by chatting with the assistant.
      </p>
      {!hasQuery && (
        <button
          onClick={onNew}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium"
        >
          <Plus className="w-4 h-4" />
          Create your first skill
        </button>
      )}
    </div>
  );
}

function SkillCard({ s }: { s: SkillDoc }) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const open = () => navigate({ to: "/skills/$skillId", params: { skillId: s.id } });

  const description =
    s.description ??
    (s.file.trim()
      ? s.file.replace(/[#*_`>-]/g, "").trim().slice(0, 140)
      : "Empty skill — open to start chatting.");

  const onRename = () => {
    const next = window.prompt("Rename skill", s.name);
    if (next && next.trim()) renameSkill(s.id, next.trim());
  };

  const onRewriteDescription = () => {
    // Mocked AI rewrite — synthesizes a short summary from the skill file.
    const base = s.file.replace(/[#*_`>-]/g, "").replace(/\s+/g, " ").trim();
    const summary = base
      ? `Guides the assistant to ${base.slice(0, 120).toLowerCase()}${base.length > 120 ? "…" : ""}`
      : `A reusable instruction file for ${s.name}. Open it to define what the AI should do.`;
    setSkillDescription(s.id, summary);
  };

  return (
    <div
      ref={rootRef}
      className="relative rounded-xl bg-surface card-shadow transition-transform hover:-translate-y-0.5 border border-subtle cursor-pointer"
      onClick={open}
    >
      <div className="flex items-start gap-2.5 px-4 pt-4">
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-raised">
          <Sparkles className="w-4 h-4 text-text-secondary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-text-primary truncate">
            {s.name}
          </div>
          <div className="text-[11px] text-text-tertiary truncate">
            {s.messages.length} message{s.messages.length === 1 ? "" : "s"} ·{" "}
            {new Date(s.updatedAt).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenu((v) => !v);
          }}
          aria-label="More"
          className="p-1 -mr-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <p className="px-4 mt-2 pb-4 text-[12px] text-text-secondary line-clamp-2 min-h-[36px]">
        {description}
      </p>

      {menu && (
        <div
          className="absolute right-2 top-11 z-30 min-w-[190px] rounded-lg border border-subtle bg-surface card-shadow py-1 text-[13px]"
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            icon={<Settings2 className="w-3.5 h-3.5" />}
            label="Configure"
            onClick={() => {
              setMenu(false);
              open();
            }}
          />
          <MenuItem
            icon={<Pencil className="w-3.5 h-3.5" />}
            label="Rename"
            onClick={() => {
              setMenu(false);
              onRename();
            }}
          />
          <MenuItem
            icon={<Wand2 className="w-3.5 h-3.5" />}
            label="Rewrite description"
            onClick={() => {
              setMenu(false);
              onRewriteDescription();
            }}
          />
          <MenuItem
            icon={<Copy className="w-3.5 h-3.5" />}
            label="Duplicate"
            onClick={() => {
              setMenu(false);
              duplicateSkill(s.id);
            }}
          />
          <MenuItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Delete"
            danger
            onClick={() => {
              setMenu(false);
              if (confirm(`Delete "${s.name}"?`)) deleteSkill(s.id);
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "w-full flex items-center gap-2 px-3 py-1.5 hover:bg-hover text-left " +
        (danger ? "text-red" : "text-text-primary")
      }
    >
      {icon}
      {label}
    </button>
  );
}
