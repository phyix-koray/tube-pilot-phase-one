import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { mockWorkflows } from "@/mock/data";
import { RunAgentWizard } from "./_app.agents";

export const Route = createFileRoute("/_app/run/$agentId")({
  loader: ({ params }) => {
    const wf = mockWorkflows.find((w) => w.id === params.agentId);
    if (!wf) throw notFound();
    return { workflow: wf };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Run ${loaderData.workflow.name} — TubePilot`
          : "Run agent — TubePilot",
      },
    ],
  }),
  component: RunAgentPage,
  notFoundComponent: () => (
    <div className="text-[13px] text-text-secondary">Agent not found.</div>
  ),
});

function RunAgentPage() {
  const { workflow } = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <div className="space-y-5 w-full">
      <Link
        to="/agents"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Agents
      </Link>

      <RunAgentWizard
        agent={workflow}
        variant="page"
        onDone={() => navigate({ to: "/videos" })}
      />
    </div>
  );
}
