import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Users, Trash2, MoreHorizontal, Workflow as WorkflowIcon } from "lucide-react";
import { useState } from "react";
import { mockWorkflows } from "@/mock/data";
import { cn } from "@/lib/tp";
import {
  useAgentTeams,
  createAgentTeam,
  deleteAgentTeam,
  type AgentTeam,
} from "@/lib/agent-teams-store";

export const Route = createFileRoute("/_app/agent-teams/")({
  head: () => ({
    meta: [
      { title: "Agent Teams — TubePilot" },
      {
        name: "description",
        content: "Chain multiple agents together into a single automated workflow.",
      },
    ],
  }),
  component: AgentTeamsPage,
});

function AgentTeamsPage() {
  const teams = useAgentTeams();
  const navigate = useNavigate();
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const handleCreate = () => {
    const team = createAgentTeam("New team");
    navigate({ to: "/agent-teams/$teamId", params: { teamId: team.id } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Agent Teams</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Chain agents together so they hand work off to each other automatically.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Agent Team
        </button>
      </div>

      {teams.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              menuOpen={menuFor === team.id}
              onToggleMenu={() => setMenuFor((v) => (v === team.id ? null : team.id))}
              onDelete={() => {
                deleteAgentTeam(team.id);
                setMenuFor(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-subtle bg-surface px-6 py-16 text-center">
      <div className="w-11 h-11 rounded-full bg-raised mx-auto flex items-center justify-center mb-4">
        <Users className="w-5 h-5 text-text-secondary" />
      </div>
      <h2 className="text-[15px] font-semibold text-text-primary">No agent teams yet</h2>
      <p className="text-[13px] text-text-secondary mt-1.5 max-w-sm mx-auto">
        Combine your agents into a single pipeline — one agent's output becomes the next
        one's input, automatically.
      </p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium"
      >
        <Plus className="w-4 h-4" />
        Create Agent Team
      </button>
    </div>
  );
}

function TeamCard({
  team,
  menuOpen,
  onToggleMenu,
  onDelete,
}: {
  team: AgentTeam;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onDelete: () => void;
}) {
  const agentNames = team.nodes
    .map((n) => mockWorkflows.find((w) => w.id === n.agentId)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="relative rounded-xl border border-subtle bg-surface hover:border-text-tertiary/40 transition-colors overflow-hidden">
      <Link to="/agent-teams/$teamId" params={{ teamId: team.id }} className="block p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-raised flex items-center justify-center shrink-0">
            <WorkflowIcon className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-text-primary truncate">
              {team.name}
            </div>
            <div className="text-[12px] text-text-tertiary">
              {team.nodes.length} agent{team.nodes.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        {agentNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {agentNames.slice(0, 3).map((name, i) => (
              <span
                key={i}
                className="rounded-md bg-raised px-2 py-1 text-[11px] text-text-secondary"
              >
                {name}
              </span>
            ))}
            {agentNames.length > 3 && (
              <span className="rounded-md bg-raised px-2 py-1 text-[11px] text-text-tertiary">
                +{agentNames.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <div className="text-[12px] text-text-tertiary">Empty — add agents to get started</div>
        )}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleMenu();
        }}
        className="absolute top-3 right-3 p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
        aria-label="More"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {menuOpen && (
        <div
          className="absolute top-11 right-3 z-30 min-w-[140px] rounded-lg border border-subtle bg-surface card-shadow py-1 text-[13px]"
          onMouseLeave={onToggleMenu}
        >
          <button
            onClick={onDelete}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 hover:bg-hover text-left text-red",
            )}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
