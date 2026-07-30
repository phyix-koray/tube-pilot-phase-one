import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/agent-teams/$teamId")({
  head: () => ({
    meta: [{ title: "Agent Team — TubePilot" }],
  }),
  component: AgentTeamEditorPage,
});

// @xyflow/react tarayıcı API'lerine (ResizeObserver, window, document) bağımlı
// olduğu için sunucu tarafında (SSR) import edilmemesi gerekiyor — bu yüzden
// canvas'ın tamamı ayrı bir dosyada, burada lazy + client-only yükleniyor.
const AgentTeamCanvas = lazy(() => import("@/components/AgentTeamCanvas"));

function AgentTeamEditorPage() {
  const { teamId } = useParams({ from: "/_app/agent-teams/$teamId" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative flex items-center justify-center h-[60vh] text-[13px] text-text-secondary">
        <Link
          to="/agent-teams"
          className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary absolute top-0 left-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Agent Teams
        </Link>
        Loading canvas…
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh] text-[13px] text-text-secondary">
          Loading canvas…
        </div>
      }
    >
      <AgentTeamCanvas teamId={teamId} />
    </Suspense>
  );
}
