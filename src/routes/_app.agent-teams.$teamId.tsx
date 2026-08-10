import { createFileRoute, useParams } from "@tanstack/react-router";
import AgentTeamCanvas from "@/components/AgentTeamCanvas";
import { AgentTeamErrorBoundary } from "@/components/AgentTeamErrorBoundary";

export const Route = createFileRoute("/_app/agent-teams/$teamId")({
  // _app parent zaten ssr:false ama burada da açıkça belirtiyoruz —
  // React Flow tarayıcıya-özgü API'lere (ResizeObserver, window) ihtiyaç
  // duyuyor, sunucu tarafında hiç render edilmemesi gerekiyor.
  ssr: false,
  head: () => ({
    meta: [{ title: "Agent Team — TubePilot" }],
  }),
  component: AgentTeamEditorPage,
});

function AgentTeamEditorPage() {
  const { teamId } = useParams({ from: "/_app/agent-teams/$teamId" });
  return (
    <AgentTeamErrorBoundary>
      <AgentTeamCanvas teamId={teamId} />
    </AgentTeamErrorBoundary>
  );
}
