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
    <div className="space-y-5 max-w-3xl mx-auto">
      <Link
        to="/agents"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Agents
      </Link>

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Run {workflow.name}
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary max-w-2xl">
          Full-page workflow — configure every step, review viral topic
          analysis, and launch when ready.
        </p>
      </div>

      <RunAgentWizard
        agent={workflow}
        variant="page"
        onDone={() => navigate({ to: "/videos" })}
      />
    </div>
  );
}
