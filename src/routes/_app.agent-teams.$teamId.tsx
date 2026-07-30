import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Play, Search, X } from "lucide-react";
import { mockWorkflows } from "@/mock/data";
import { cn } from "@/lib/tp";
import {
  getAgentTeam,
  useAgentTeam,
  renameAgentTeam,
  updateTeamGraph,
  type TeamNode,
  type TeamEdge,
} from "@/lib/agent-teams-store";
import { AgentTeamNode, type AgentNodeData } from "@/components/AgentTeamNode";

export const Route = createFileRoute("/_app/agent-teams/$teamId")({
  head: () => ({
    meta: [{ title: "Agent Team — TubePilot" }],
  }),
  component: AgentTeamEditorPage,
});

const nodeTypes: NodeTypes = { agent: AgentTeamNode };

function toFlowNodes(teamNodes: TeamNode[], onRemove: (id: string) => void): Node[] {
  return teamNodes.map((n) => ({
    id: n.id,
    type: "agent",
    position: n.position,
    data: { agentId: n.agentId, onRemove } satisfies AgentNodeData,
  }));
}

function toFlowEdges(teamEdges: TeamEdge[]): Edge[] {
  return teamEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.condition,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "var(--tp-text-tertiary)" },
    labelBgStyle: { fill: "var(--tp-surface)" },
    labelStyle: { fill: "var(--tp-text-secondary)", fontSize: 11 },
  }));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function AgentTeamEditorPage() {
  const { teamId } = useParams({ from: "/_app/agent-teams/$teamId" });
  const team = useAgentTeam(teamId);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<{
    screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number };
  } | null>(null);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [titleEdit, setTitleEdit] = useState(false);
  const [edgeEditing, setEdgeEditing] = useState<string | null>(null);

  const removeNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  // Team yüklendiğinde (veya değiştiğinde) canvas'ı ilklendir.
  useEffect(() => {
    if (!team) return;
    setNodes(toFlowNodes(team.nodes, removeNode));
    setEdges(toFlowEdges(team.edges));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Canvas değiştikçe (debounce'suz, basit) store'a kaydet.
  useEffect(() => {
    if (!team) return;
    const teamNodes: TeamNode[] = nodes.map((n) => ({
      id: n.id,
      agentId: (n.data as AgentNodeData).agentId,
      position: n.position,
    }));
    const teamEdges: TeamEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      condition: typeof e.label === "string" ? e.label : undefined,
    }));
    updateTeamGraph(teamId, teamNodes, teamEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: uid(),
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "var(--tp-text-tertiary)" },
          },
          eds,
        ),
      ),
    [],
  );

  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    setEdgeEditing(edge.id);
  }, []);

  const filteredAgents = useMemo(() => {
    const needle = paletteQuery.trim().toLowerCase();
    if (!needle) return mockWorkflows;
    return mockWorkflows.filter((w) => w.name.toLowerCase().includes(needle));
  }, [paletteQuery]);

  const addAgentNode = (agentId: string) => {
    const position = reactFlowInstance
      ? reactFlowInstance.screenToFlowPosition({
          x: (wrapperRef.current?.clientWidth ?? 600) / 2 + 260,
          y: 120 + nodes.length * 90,
        })
      : { x: 400, y: 120 + nodes.length * 90 };
    const newNode: Node = {
      id: uid(),
      type: "agent",
      position,
      data: { agentId, onRemove: removeNode } satisfies AgentNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const editingEdge = edges.find((e) => e.id === edgeEditing);

  if (!team) {
    return (
      <div className="text-[13px] text-text-secondary">
        <Link to="/agent-teams" className="text-blue hover:underline">
          ← Agent Teams
        </Link>
        <div className="mt-3">Team not found.</div>
      </div>
    );
  }

  return (
    <div className="-mx-4 md:-mx-8 -my-6 md:-my-8 flex h-[calc(100vh-0px)]">
      {/* Left palette */}
      <div className="w-[260px] shrink-0 border-r border-subtle bg-surface flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <Link
            to="/agent-teams"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Agent Teams
          </Link>
          <div className="text-[11px] font-medium tracking-wider text-text-tertiary mb-2">
            YOUR AGENTS
          </div>
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
              placeholder="Search agents..."
              className="h-8 w-full rounded-md bg-raised border border-subtle pl-8 pr-3 text-[12.5px] placeholder:text-text-tertiary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
          {filteredAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => addAgentNode(agent.id)}
              className="w-full flex items-center gap-2.5 rounded-lg border border-subtle bg-base hover:border-text-tertiary/50 hover:bg-hover px-3 py-2.5 text-left transition-colors"
              title={`Add ${agent.name} to the canvas`}
            >
              <div
                className="w-7 h-7 rounded-full shrink-0 bg-cover bg-center border border-subtle"
                style={{
                  backgroundImage: agent.avatar ? `url(${agent.avatar})` : undefined,
                  backgroundColor: agent.accent ?? "var(--tp-raised)",
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-text-primary truncate">
                  {agent.name}
                </div>
                <div className="text-[11px] text-text-tertiary">{agent.steps.length} steps</div>
              </div>
            </button>
          ))}
          {filteredAgents.length === 0 && (
            <div className="text-[12px] text-text-tertiary text-center py-6">No agents found.</div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-subtle text-[11px] text-text-tertiary leading-relaxed">
          Click an agent to add it, then drag from its bottom dot to another agent's top dot to
          connect them.
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between gap-3 px-6 h-14 border-b border-subtle">
          {titleEdit ? (
            <input
              autoFocus
              defaultValue={team.name}
              onBlur={(e) => {
                renameAgentTeam(team.id, e.target.value.trim() || "Untitled team");
                setTitleEdit(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setTitleEdit(false);
              }}
              className="text-[15px] font-semibold bg-transparent outline-none border-b border-subtle"
            />
          ) : (
            <h1
              onClick={() => setTitleEdit(true)}
              className="text-[15px] font-semibold text-text-primary cursor-text hover:opacity-80"
            >
              {team.name}
            </h1>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-text-tertiary">
              {nodes.length} agent{nodes.length === 1 ? "" : "s"} · {edges.length} connection
              {edges.length === 1 ? "" : "s"}
            </span>
            <button
              disabled
              title="Running teams end-to-end is coming soon — for now, build and save your pipeline here."
              className="inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] opacity-40 cursor-not-allowed px-3.5 h-8 text-[12.5px] font-medium"
            >
              <Play className="w-3.5 h-3.5" />
              Run team
            </button>
          </div>
        </div>

        <div ref={wrapperRef} className="flex-1 relative">
          {nodes.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-xs">
                <div className="text-[14px] font-medium text-text-primary mb-1">
                  Start building your team
                </div>
                <div className="text-[13px] text-text-secondary">
                  Pick an agent from the left panel to add it to the canvas.
                </div>
              </div>
            </div>
          )}
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              onInit={(instance) => setReactFlowInstance(instance)}
              fitView
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ type: "smoothstep" }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--tp-subtle)" />
              <Controls showInteractive={false} />
              <MiniMap
                pannable
                zoomable
                maskColor="var(--tp-raised)"
                style={{ background: "var(--tp-surface)" }}
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {/* Edge condition editor */}
      {editingEdge && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20" onClick={() => setEdgeEditing(null)}>
          <div
            className="w-[340px] rounded-xl border border-subtle bg-surface card-shadow p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-text-primary">Connection label</div>
              <button
                onClick={() => setEdgeEditing(null)}
                className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              autoFocus
              defaultValue={typeof editingEdge.label === "string" ? editingEdge.label : ""}
              placeholder="e.g. Success, Failed, Needs review"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = (e.target as HTMLInputElement).value.trim();
                  setEdges((eds) =>
                    eds.map((ed) => (ed.id === editingEdge.id ? { ...ed, label: value || undefined } : ed)),
                  );
                  setEdgeEditing(null);
                }
                if (e.key === "Escape") setEdgeEditing(null);
              }}
              className="w-full h-9 rounded-md bg-raised border border-subtle px-3 text-[13px] placeholder:text-text-tertiary outline-none focus:border-blue"
            />
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => {
                  setEdges((eds) => eds.filter((ed) => ed.id !== editingEdge.id));
                  setEdgeEditing(null);
                }}
                className="text-[12.5px] text-red hover:underline"
              >
                Remove connection
              </button>
              <button
                onClick={(e) => {
                  const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement) ?? null;
                  const value = input?.value.trim();
                  setEdges((eds) =>
                    eds.map((ed) => (ed.id === editingEdge.id ? { ...ed, label: value || undefined } : ed)),
                  );
                  setEdgeEditing(null);
                }}
                className={cn(
                  "inline-flex items-center rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3 h-8 text-[12.5px] font-medium",
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
