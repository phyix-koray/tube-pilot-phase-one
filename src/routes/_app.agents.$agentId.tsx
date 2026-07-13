import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  Play,
} from "lucide-react";
import { mockChannels, mockWorkflows, type WorkflowStep } from "@/mock/data";
import { cn } from "@/lib/tp";
import { StepBar, type Step } from "@/components/StepFlow";

export const Route = createFileRoute("/_app/agents/$agentId")({
  loader: ({ params }) => {
    const wf = mockWorkflows.find((w) => w.id === params.agentId);
    if (!wf) throw notFound();
    return { workflow: wf };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.workflow.name} — TubePilot`
          : "Workflow",
      },
    ],
  }),
  component: ConfigurePage,
  notFoundComponent: () => (
    <div className="p-8 text-text-secondary">Workflow not found.</div>
  ),
});

const CONFIG_STEPS: Step[] = [
  { key: "basics", title: "Basics" },
  { key: "content", title: "Content" },
  { key: "schedule", title: "Schedule" },
  { key: "publishing", title: "Publishing" },
  { key: "review", title: "Review" },
];

function ConfigurePage() {
  const { workflow } = Route.useLoaderData();
  const navigate = useNavigate();
  const accent = workflow.accent ?? "var(--tp-blue)";

  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  // Config state
  const suggestedChannel =
    mockChannels.find((c) => c.usedIn?.includes(workflow.name)) ??
    mockChannels[0];
  const [name, setName] = useState(workflow.name);
  const [channelId, setChannelId] = useState(suggestedChannel.id);
  const [genre, setGenre] = useState(
    workflow.id === "music-composer"
      ? "slow smooth jazz, saxophone, cozy ambient, world lounge..."
      : "history, geopolitics, sports recap",
  );
  const [songsPerRun, setSongsPerRun] = useState("10");
  const [model, setModel] = useState("Claude");
  const [freq, setFreq] = useState("Every day");
  const [runTime, setRunTime] = useState("14:30");
  const [tz, setTz] = useState("Europe/Istanbul");
  const [visibility, setVisibility] = useState("Public");
  const [reviewWindow, setReviewWindow] = useState(true);

  const channel = mockChannels.find((c) => c.id === channelId)!;

  const next = () => setStep((s) => Math.min(s + 1, CONFIG_STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3200);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[13px] text-text-secondary flex items-center gap-1">
        <Link to="/agents" className="hover:text-text-primary">
          Agents
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text-primary">{workflow.name}</span>
      </div>

      {/* Header */}
      <div
        className="rounded-xl bg-surface card-shadow p-5"
        style={{ border: `2px solid ${accent}` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full overflow-hidden shrink-0"
            style={{ backgroundColor: accent }}
          >
            {workflow.avatar && (
              <img
                src={workflow.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold tracking-tight truncate">
              Configure {workflow.name}
            </h1>
            <p className="text-[13px] text-text-secondary mt-0.5 line-clamp-2">
              {workflow.description}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <StepBar
            steps={CONFIG_STEPS}
            current={step}
            accent={accent}
            onJump={setStep}
          />
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="rounded-xl bg-surface border border-subtle card-shadow p-5 min-h-[320px]">
          {step === 0 && (
            <div className="space-y-4">
              <SectionHeading
                title="Basics"
                hint="Give this agent a name and pick which channel it publishes to."
              />
              <Field label="Agent name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
                />
              </Field>
              <Field label="YouTube channel">
                <div className="grid gap-2">
                  {mockChannels.map((c) => (
                    <label
                      key={c.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-3 cursor-pointer",
                        channelId === c.id
                          ? "bg-raised"
                          : "bg-raised/40 hover:bg-raised",
                      )}
                      style={
                        channelId === c.id
                          ? { border: `2px solid ${accent}` }
                          : { border: "1px solid var(--tp-subtle)" }
                      }
                    >
                      <input
                        type="radio"
                        name="channel"
                        checked={channelId === c.id}
                        onChange={() => setChannelId(c.id)}
                        className="sr-only"
                      />
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                        style={{
                          backgroundColor: c.color + "22",
                          color: c.color,
                        }}
                      >
                        {c.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium">{c.name}</div>
                        <div className="text-[11px] text-text-tertiary truncate">
                          {c.niche || "No niche set"}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <SectionHeading
                title="Content"
                hint="What should this agent create every run?"
              />
              <Field label={workflow.id === "music-composer" ? "Genre guidance" : "Niche / topic guidance"}>
                <textarea
                  rows={4}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[13px] resize-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={workflow.id === "music-composer" ? "Songs per run" : "Videos per run"}>
                  <Select value={songsPerRun} onChange={setSongsPerRun}>
                    <option>5</option>
                    <option>10</option>
                    <option>15</option>
                  </Select>
                </Field>
                <Field label="AI Model">
                  <Select value={model} onChange={setModel}>
                    <option>Claude</option>
                    <option>GPT-4o</option>
                    <option>Gemini</option>
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <SectionHeading
                title="Schedule"
                hint="How often should this agent run?"
              />
              <Field label="Frequency">
                <Select value={freq} onChange={setFreq}>
                  <option>Every day</option>
                  <option>Every 2 days</option>
                  <option>Every 3 days</option>
                  <option>Weekly</option>
                  <option>Custom interval</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Run time">
                  <input
                    type="time"
                    value={runTime}
                    onChange={(e) => setRunTime(e.target.value)}
                    className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 font-mono text-[13px]"
                  />
                </Field>
                <Field label="Timezone">
                  <Select value={tz} onChange={setTz}>
                    <option>Europe/Istanbul</option>
                    <option>UTC</option>
                    <option>America/New_York</option>
                  </Select>
                </Field>
              </div>
              <div className="text-[11px] text-text-tertiary rounded-md bg-raised/60 border border-subtle p-3">
                Next runs · Jul 13 {runTime} · Jul 14 {runTime} · Jul 15 {runTime}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SectionHeading
                title="Publishing"
                hint="How videos leave the agent and reach your channel."
              />
              <Field label="Visibility">
                <Select value={visibility} onChange={setVisibility}>
                  <option>Public</option>
                  <option>Unlisted</option>
                  <option>Private</option>
                </Select>
              </Field>
              <div
                className={cn(
                  "rounded-lg p-4",
                  reviewWindow ? "bg-raised" : "bg-raised/40",
                )}
                style={
                  reviewWindow
                    ? { border: `2px solid ${accent}` }
                    : { border: "1px solid var(--tp-subtle)" }
                }
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewWindow}
                    onChange={(e) => setReviewWindow(e.target.checked)}
                    className="mt-0.5 accent-blue"
                  />
                  <div>
                    <div className="text-[13px] font-medium">
                      24h review window
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      Videos land in <span className="text-text-secondary">Pending Review</span>{" "}
                      first. If you don't act, they auto-publish after 24h.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <SectionHeading
                title="Review"
                hint="Confirm your configuration."
              />
              <div className="rounded-lg bg-raised border border-subtle divide-y divide-subtle text-[13px]">
                <ReviewRow label="Name" value={name} />
                <ReviewRow
                  label="Channel"
                  value={`${channel.name} ${channel.emoji}`}
                />
                <ReviewRow label="Guidance" value={genre} multiline />
                <ReviewRow label="Per run" value={songsPerRun} />
                <ReviewRow label="Model" value={model} />
                <ReviewRow
                  label="Schedule"
                  value={`${freq} at ${runTime} · ${tz}`}
                />
                <ReviewRow label="Visibility" value={visibility} />
                <ReviewRow
                  label="Review window"
                  value={reviewWindow ? "24h before publish" : "Off — auto-publishes"}
                />
              </div>
              {saved && (
                <div className="flex items-center gap-2 text-[13px] text-green">
                  <CheckCircle2 className="w-4 h-4" />
                  Configuration saved.
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-subtle flex items-center justify-between">
            <button
              onClick={step === 0 ? () => navigate({ to: "/agents" }) : prev}
              className="inline-flex items-center gap-1 rounded-md hover:bg-hover px-2.5 h-9 text-[13px] text-text-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? "Back to agents" : "Previous"}
            </button>

            <div className="flex items-center gap-2">
              <div className="text-[11px] text-text-tertiary">
                Step {step + 1} of {CONFIG_STEPS.length}
              </div>
              {step < CONFIG_STEPS.length - 1 ? (
                <button
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={save}
                    className="inline-flex items-center gap-1.5 rounded-md bg-raised hover:bg-hover px-3.5 h-9 text-[13px] font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      save();
                      navigate({ to: "/agents" });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Save & finish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side: pipeline preview */}
        <aside className="lg:sticky lg:top-6 rounded-xl bg-surface border border-subtle p-5 card-shadow">
          <div className="text-[13px] font-semibold mb-3">Pipeline</div>
          <ol className="space-y-2 text-[12px]">
            {workflow.steps.map((s: WorkflowStep) => (
              <li key={s.n} className="flex gap-2">
                <span className="font-mono text-text-tertiary w-6 shrink-0">
                  {String(s.n).padStart(2, "0")}
                </span>
                <span className="text-text-secondary">{s.title}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <div className="text-[16px] font-semibold">{title}</div>
      <div className="text-[13px] text-text-secondary mt-0.5">{hint}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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

function ReviewRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-3 px-3 py-2.5">
      <div className="w-24 shrink-0 text-[11px] uppercase tracking-wide text-text-tertiary pt-0.5">
        {label}
      </div>
      <div
        className={cn(
          "flex-1 text-text-primary",
          multiline ? "whitespace-pre-wrap" : "truncate",
        )}
      >
        {value}
      </div>
    </div>
  );
}
