import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Play,
  Pause,
  MoreHorizontal,
  ChevronRight,
  Check,
  X,
  ExternalLink,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { mockWorkflows, type WorkflowStep } from "@/mock/data";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/agents/$agentId")({
  loader: ({ params }) => {
    const wf = mockWorkflows.find((w) => w.id === params.agentId);
    if (!wf) throw notFound();
    return { workflow: wf };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.workflow.name} — TubePilot` : "Workflow",
      },
    ],
  }),
  component: WorkflowDetail,
  notFoundComponent: () => (
    <div className="p-8 text-text-secondary">Workflow not found.</div>
  ),
});

function WorkflowDetail() {
  const { workflow } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[13px] text-text-secondary flex items-center gap-1">
        <Link to="/agents" className="hover:text-text-primary">
          Library
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text-primary">{workflow.name}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          {workflow.name}
        </h1>
        <p className="text-[13px] text-text-secondary mt-1 max-w-2xl">
          {workflow.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button className="inline-flex items-center gap-1.5 rounded-md bg-blue hover:bg-blue/90 text-white px-3.5 h-9 text-[13px] font-medium">
            <Play className="w-3.5 h-3.5" />
            Run Now
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-raised hover:bg-hover px-3.5 h-9 text-[13px]">
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
          <button className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover px-3 h-9 text-[13px]">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 text-[13px] text-text-secondary flex items-center gap-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              workflow.status === "running"
                ? "bg-green pulse-dot"
                : workflow.status === "scheduled"
                  ? "bg-blue"
                  : "bg-text-tertiary",
            )}
          />
          <span className="capitalize">{workflow.status}</span>
          {workflow.nextRun && <span>· Next run: {workflow.nextRun}</span>}
          {workflow.lastRun && <span>· Last run: {workflow.lastRun}</span>}
        </div>
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Steps timeline */}
        <div className="relative pl-6">
          <div className="absolute left-[10px] top-2 bottom-2 w-px bg-subtle" />
          <ol className="space-y-3">
            {workflow.steps.map((s: WorkflowStep) => (
              <StepCard key={s.n} step={s} status="idle" />
            ))}
          </ol>
        </div>

        {/* Config panel */}
        <ConfigPanel />
      </div>

      {/* Run History */}
      <div className="rounded-xl bg-surface border border-subtle p-5 card-shadow">
        <div className="text-[15px] font-semibold mb-3">Run History</div>
        <div className="divide-y divide-subtle text-[13px]">
          {[
            { date: "Jul 04", status: "Completed", songs: 10 },
            { date: "Jul 03", status: "Completed", songs: 10 },
            { date: "Jul 02", status: "Failed", songs: 0, error: true },
            { date: "Jul 01", status: "Completed", songs: 10 },
            { date: "Jun 30", status: "Completed", songs: 10 },
            { date: "Jun 29", status: "Completed", songs: 10 },
            { date: "Jun 28", status: "Completed", songs: 10 },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 text-text-secondary"
            >
              <span className="text-text-primary w-14 font-mono">{r.date}</span>
              {r.error ? (
                <span className="inline-flex items-center gap-1 text-red">
                  <X className="w-3.5 h-3.5" />
                  Failed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-green">
                  <Check className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
              <span className="ml-2">{r.songs} songs</span>
              {r.error ? (
                <button className="ml-auto text-text-secondary hover:text-text-primary">
                  See error
                </button>
              ) : (
                <ExternalLink className="ml-auto w-3.5 h-3.5" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  status,
}: {
  step: WorkflowStep;
  status: "idle" | "current" | "done";
}) {
  return (
    <li className="relative">
      {/* Node */}
      <span className="absolute -left-[26px] top-4 w-4 h-4 rounded-full bg-base border-2 border-subtle flex items-center justify-center">
        {status === "done" ? (
          <CheckCircle2 className="w-3 h-3 text-blue" />
        ) : (
          <Circle className="w-2 h-2 text-text-tertiary" />
        )}
      </span>

      <div
        className={cn(
          "rounded-xl bg-surface border border-subtle p-4 card-shadow border-l-[3px]",
          status === "current"
            ? "border-l-green"
            : status === "done"
              ? "border-l-blue"
              : "border-l-subtle",
        )}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[12px] text-text-tertiary">
            {String(step.n).padStart(2, "0")}
          </span>
          <div className="text-[15px] font-medium">{step.title}</div>
        </div>
        <p className="text-[13px] text-text-secondary mt-1">{step.description}</p>
        {step.config && (
          <div className="mt-2 text-[11px] font-mono">
            <span className="text-text-tertiary">CONFIG </span>
            <span className="text-text-secondary">{step.config}</span>
          </div>
        )}
        {step.output && (
          <div className="text-[11px] font-mono mt-1">
            <span className="text-text-tertiary">OUTPUT </span>
            <span style={{ color: "rgba(48,209,88,0.85)" }}>{step.output}</span>
          </div>
        )}
      </div>
    </li>
  );
}

function ConfigPanel() {
  const [freq, setFreq] = useState("Every day");
  const [instrumental, setInstrumental] = useState(true);
  const [autoDist, setAutoDist] = useState(true);
  const [showCal, setShowCal] = useState(true);
  const [review, setReview] = useState(true);

  return (
    <div className="lg:sticky lg:top-6 rounded-xl bg-surface border border-subtle p-5 card-shadow space-y-4 text-[13px]">
      <div className="text-[15px] font-semibold">Run Configuration</div>

      <Field label="Posting Frequency">
        <Select value={freq} onChange={setFreq}>
          <option>Every day</option>
          <option>Every 2 days</option>
          <option>Every 3 days</option>
          <option>Weekly</option>
          <option>Custom interval</option>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Run time">
          <input
            defaultValue="14:30"
            className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 font-mono text-[13px]"
          />
        </Field>
        <Field label="Timezone">
          <Select value="Europe/Istanbul" onChange={() => {}}>
            <option>Europe/Istanbul</option>
            <option>UTC</option>
            <option>America/New_York</option>
          </Select>
        </Field>
      </div>

      <Field label="Genre Guidance">
        <textarea
          rows={3}
          defaultValue="slow smooth jazz, saxophone, cozy ambient, world lounge..."
          className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[13px] resize-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Songs per run">
          <Select value="10" onChange={() => {}}>
            <option>5</option>
            <option>10</option>
            <option>15</option>
          </Select>
        </Field>
        <Field label="Loop count">
          <Select value="5" onChange={() => {}}>
            <option>3</option>
            <option>5</option>
            <option>10</option>
          </Select>
        </Field>
      </div>

      <Field label="AI Model">
        <Select value="Claude" onChange={() => {}}>
          <option>Claude</option>
          <option>GPT-4o</option>
          <option>Gemini</option>
        </Select>
      </Field>

      <Toggle
        label="Instrumental"
        value={instrumental}
        onChange={setInstrumental}
      />

      <Field label="Output type">
        <div className="space-y-1.5">
          <RadioRow name="out" defaultChecked label="Image only" />
          <RadioRow name="out" label="Image + Motion video" />
        </div>
      </Field>

      <Field label="YouTube Channel">
        <Select value="Coastal Sounds 🌊" onChange={() => {}}>
          <option>Coastal Sounds 🌊</option>
          <option>Stickman United</option>
        </Select>
      </Field>

      <Field label="Visibility">
        <Select value="Public" onChange={() => {}}>
          <option>Public</option>
          <option>Unlisted</option>
          <option>Private</option>
        </Select>
      </Field>

      <div className="rounded-md border border-subtle bg-raised p-3 space-y-2">
        <Toggle
          label="Review window (24h)"
          value={review}
          onChange={setReview}
        />
        <p className="text-[11px] text-text-tertiary leading-relaxed">
          Video goes to "Pending Review" before auto-publishing.
        </p>
      </div>

      <div className="rounded-md border border-subtle bg-raised p-3 space-y-2">
        <Toggle
          label="Show on Content Calendar"
          value={showCal}
          onChange={setShowCal}
        />
        <Toggle
          label="Auto-distribute across days"
          value={autoDist}
          onChange={setAutoDist}
        />
      </div>

      <div className="text-[11px] text-text-tertiary">
        Next runs: Jul 13, 14:30 · Jul 14, 14:30 · Jul 15, 14:30
      </div>

      <button className="w-full h-9 rounded-md bg-blue hover:bg-blue/90 text-white text-[13px] font-medium">
        Save Configuration
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px] text-text-primary"
    >
      {children}
    </select>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between text-[13px]"
    >
      <span className="text-text-primary">{label}</span>
      <span
        className={cn(
          "w-8 h-5 rounded-full p-0.5 flex transition-colors",
          value ? "bg-blue" : "bg-subtle",
        )}
      >
        <span
          className={cn(
            "w-4 h-4 bg-white rounded-full transition-transform",
            value ? "translate-x-3" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

function RadioRow({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] cursor-pointer">
      <input
        type="radio"
        name={name}
        defaultChecked={defaultChecked}
        className="accent-blue"
      />
      {label}
    </label>
  );
}
