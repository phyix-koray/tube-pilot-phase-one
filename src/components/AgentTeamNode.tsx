import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { mockWorkflows } from "@/mock/data";

export interface AgentNodeData {
  agentId: string;
  onRemove: (nodeId: string) => void;
  [key: string]: unknown;
}

export function AgentTeamNode({ id, data }: NodeProps) {
  const nodeData = data as AgentNodeData;
  const agent = mockWorkflows.find((w) => w.id === nodeData.agentId);

  if (!agent) {
    return (
      <div className="rounded-xl border border-red/40 bg-surface px-4 py-3 text-[12px] text-red">
        Unknown agent
      </div>
    );
  }

  return (
    <div className="group relative w-[220px] rounded-xl border border-subtle bg-surface card-shadow hover:border-text-tertiary/50 transition-colors">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-text-tertiary !border-2 !border-surface"
      />
      <button
        onClick={() => nodeData.onRemove(id)}
        className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-text-primary text-[color:var(--tp-base)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove agent"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-center gap-2.5 p-3">
        <div
          className="w-8 h-8 rounded-full shrink-0 bg-cover bg-center border border-subtle"
          style={{
            backgroundImage: agent.avatar ? `url(${agent.avatar})` : undefined,
            backgroundColor: agent.accent ?? "var(--tp-raised)",
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-text-primary truncate">
            {agent.name}
          </div>
          <div className="text-[11px] text-text-tertiary">{agent.steps.length} steps</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-blue !border-2 !border-surface"
      />
    </div>
  );
}
