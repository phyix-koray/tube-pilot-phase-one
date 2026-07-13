import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  Play,
  Sparkles,
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

const SUGGESTED_THEME =
  "Thin winter rain taps against the tall windows of a softly lit Seoul hanok guesthouse as a slow saxophone hums through the paper-screened rooms, its melody curling like steam rising from a clay teapot into the grey afternoon stillness.";
const SUGGESTED_TAGS =
  "slow jazz, soprano saxophone, Korean traditional hanok, rainy afternoon, clay teapot ambiance, paper screen acoustics, Seoul winter, meditative tempo, smoky intimacy";

function ConfigurePage() {
  const { workflow } = Route.useLoaderData();
  const navigate = useNavigate();
  const accent = workflow.accent ?? "var(--tp-blue)";
  const isMusic = workflow.id === "music-composer";

  const CONFIG_STEPS: Step[] = isMusic
    ? [
        { key: "basics", title: "Basics" },
        { key: "content", title: "Content" },
        { key: "media", title: "Media" },
        { key: "schedule", title: "Schedule" },
        { key: "publishing", title: "Publishing" },
        { key: "review", title: "Review" },
      ]
    : [
        { key: "basics", title: "Basics" },
        { key: "content", title: "Content" },
        { key: "schedule", title: "Schedule" },
        { key: "publishing", title: "Publishing" },
        { key: "review", title: "Review" },
      ];

  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  const suggestedChannel =
    mockChannels.find((c) => c.usedIn?.includes(workflow.name)) ??
    mockChannels[0];

  // Common
  const [name, setName] = useState(workflow.name);
  const [channelId, setChannelId] = useState(suggestedChannel.id);
  const [genre, setGenre] = useState(
    isMusic
      ? "slow smooth jazz, saxophone, cozy ambient, world lounge..."
      : "history, geopolitics, sports recap",
  );
  const [model, setModel] = useState<"claude" | "gemini" | "chatgpt">("claude");

  // Music-specific
  const [songsPerRun, setSongsPerRun] = useState(2);
  const [mergeRepeats, setMergeRepeats] = useState(2);
  const [instrumental, setInstrumental] = useState(true);
  const [themeSeed, setThemeSeed] = useState(SUGGESTED_THEME);
  const [tagsSeed, setTagsSeed] = useState(SUGGESTED_TAGS);
  const [makeThumbnail, setMakeThumbnail] = useState(true);
  const [outputMode, setOutputMode] = useState<"gorsel" | "gorsel-video">("gorsel");
  const [approveThumbnail, setApproveThumbnail] = useState(true);

  // Schedule
  const [mode, setMode] = useState<"one-shot" | "auto-daily">("auto-daily");
  const [runTime, setRunTime] = useState("14:30");
  const [tz, setTz] = useState("Europe/Istanbul");

  // Publishing
  const [autoUpload, setAutoUpload] = useState(true);
  const [visibility, setVisibility] = useState<"unlisted" | "public" | "private">("unlisted");
  const [reviewWindow, setReviewWindow] = useState(true);

  const channel = mockChannels.find((c) => c.id === channelId)!;
  const totalTracks = songsPerRun * mergeRepeats;

  const next = () => setStep((s) => Math.min(s + 1, CONFIG_STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3200);
  };

  const stepKey = CONFIG_STEPS[step].key;

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
          {stepKey === "basics" && (
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

          {stepKey === "content" && (
            <div className="space-y-4">
              <SectionHeading
                title="Content"
                hint={isMusic ? "How Suno should compose every run." : "What should this agent create every run?"}
              />
              <Field label={isMusic ? "Genre guidance" : "Niche / topic guidance"}>
                <textarea
                  rows={3}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[13px] resize-none"
                />
              </Field>
              {isMusic && (
                <>
                  <Field label="Default theme seed (AI can regenerate per run)">
                    <div className="flex items-center gap-2 mb-1.5">
                      <button
                        type="button"
                        onClick={() => setThemeSeed(SUGGESTED_THEME)}
                        className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
                      >
                        <Sparkles className="w-3 h-3" />
                        Suggest a new one
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={themeSeed}
                      onChange={(e) => setThemeSeed(e.target.value)}
                      className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[13px] resize-none"
                    />
                  </Field>
                  <Field label="First Suno keyword set">
                    <textarea
                      rows={2}
                      value={tagsSeed}
                      onChange={(e) => setTagsSeed(e.target.value)}
                      className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[12px] font-mono resize-none"
                    />
                  </Field>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label={isMusic ? "Songs per run" : "Videos per run"}>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={songsPerRun}
                    onChange={(e) => setSongsPerRun(Number(e.target.value) || 1)}
                    className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
                  />
                </Field>
                <Field label="AI keyword model">
                  <Select value={model} onChange={(v) => setModel(v as typeof model)}>
                    <option value="claude">claude</option>
                    <option value="gemini">gemini</option>
                    <option value="chatgpt">chatgpt</option>
                  </Select>
                </Field>
              </div>
              {isMusic && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Merge repetitions">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={mergeRepeats}
                        onChange={(e) => setMergeRepeats(Number(e.target.value) || 1)}
                        className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
                      />
                    </Field>
                    <Field label="Vocals">
                      <Select
                        value={instrumental ? "instrumental" : "with-vocals"}
                        onChange={(v) => setInstrumental(v === "instrumental")}
                      >
                        <option value="instrumental">Instrumental (no vocals)</option>
                        <option value="with-vocals">With vocals</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="text-[11px] text-text-tertiary rounded-md bg-raised/60 border border-subtle p-2.5">
                    → {songsPerRun} songs × {mergeRepeats} loops = <b>{totalTracks}</b> tracks in the merged file.
                  </div>
                </>
              )}
            </div>
          )}

          {stepKey === "media" && isMusic && (
            <div className="space-y-4">
              <SectionHeading
                title="Media"
                hint="Thumbnail and video render output before publishing."
              />
              <div
                className={cn(
                  "rounded-lg p-4",
                  makeThumbnail ? "bg-raised" : "bg-raised/40",
                )}
                style={
                  makeThumbnail
                    ? { border: `2px solid ${accent}` }
                    : { border: "1px solid var(--tp-subtle)" }
                }
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={makeThumbnail}
                    onChange={(e) => setMakeThumbnail(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-[13px] font-medium">
                      Generate 16:9 photorealistic thumbnail
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      GPT Image renders a cinematic still matching the day's theme.
                    </div>
                  </div>
                </label>
              </div>
              <Field label="Output mode">
                <div className="grid grid-cols-2 gap-2">
                  <ChoiceOption
                    active={outputMode === "gorsel"}
                    accent={accent}
                    title="Image only"
                    subtitle="Static thumbnail behind the audio"
                    onClick={() => setOutputMode("gorsel")}
                  />
                  <ChoiceOption
                    active={outputMode === "gorsel-video"}
                    accent={accent}
                    title="Image + video"
                    subtitle="Ambient motion background"
                    onClick={() => setOutputMode("gorsel-video")}
                  />
                </div>
              </Field>
              <div
                className={cn(
                  "rounded-lg p-4",
                  approveThumbnail ? "bg-raised" : "bg-raised/40",
                )}
                style={
                  approveThumbnail
                    ? { border: `2px solid ${accent}` }
                    : { border: "1px solid var(--tp-subtle)" }
                }
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approveThumbnail}
                    onChange={(e) => setApproveThumbnail(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-[13px] font-medium">
                      Ask me to approve the thumbnail before render
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      When off, the first generated image is used automatically.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {stepKey === "schedule" && (
            <div className="space-y-4">
              <SectionHeading
                title="Schedule"
                hint="How often should this agent run?"
              />
              <Field label="Run mode">
                <div className="grid grid-cols-2 gap-2">
                  <ChoiceOption
                    active={mode === "one-shot"}
                    accent={accent}
                    title="One-shot"
                    subtitle="Runs once when you press Run"
                    onClick={() => setMode("one-shot")}
                  />
                  <ChoiceOption
                    active={mode === "auto-daily"}
                    accent={accent}
                    title="Auto-daily"
                    subtitle="Runs every day until you stop it"
                    onClick={() => setMode("auto-daily")}
                  />
                </div>
              </Field>
              {mode === "auto-daily" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Daily run time">
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
                </>
              )}
            </div>
          )}

          {stepKey === "publishing" && (
            <div className="space-y-4">
              <SectionHeading
                title="Publishing"
                hint="How videos leave the agent and reach your channel."
              />
              <div
                className={cn(
                  "rounded-lg p-4",
                  autoUpload ? "bg-raised" : "bg-raised/40",
                )}
                style={
                  autoUpload
                    ? { border: `2px solid ${accent}` }
                    : { border: "1px solid var(--tp-subtle)" }
                }
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoUpload}
                    onChange={(e) => setAutoUpload(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-[13px] font-medium">
                      Auto-upload to YouTube after render
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      Uses the saved Google session for {channel.name}.
                    </div>
                  </div>
                </label>
              </div>
              {autoUpload && (
                <Field label="Visibility">
                  <Select value={visibility} onChange={(v) => setVisibility(v as typeof visibility)}>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </Select>
                </Field>
              )}
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
                    className="mt-0.5"
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

          {stepKey === "review" && (
            <div className="space-y-4">
              <SectionHeading title="Review" hint="Confirm your configuration." />
              <div className="rounded-lg bg-raised border border-subtle divide-y divide-subtle text-[13px]">
                <ReviewRow label="Name" value={name} />
                <ReviewRow
                  label="Channel"
                  value={`${channel.name} ${channel.emoji}`}
                />
                <ReviewRow label="Guidance" value={genre} multiline />
                {isMusic && (
                  <>
                    <ReviewRow label="Theme seed" value={themeSeed} multiline />
                    <ReviewRow label="Tags seed" value={tagsSeed} multiline />
                    <ReviewRow
                      label="Suno"
                      value={`${songsPerRun} songs × ${mergeRepeats} loops (${totalTracks} tracks) · ${instrumental ? "Instrumental" : "With vocals"} · ${model}`}
                    />
                    <ReviewRow
                      label="Media"
                      value={`${makeThumbnail ? "Thumbnail on" : "Thumbnail off"} · ${outputMode === "gorsel" ? "Image only" : "Image + video"} · ${approveThumbnail ? "manual approval" : "auto approve"}`}
                    />
                  </>
                )}
                {!isMusic && (
                  <>
                    <ReviewRow label="Per run" value={String(songsPerRun)} />
                    <ReviewRow label="Model" value={model} />
                  </>
                )}
                <ReviewRow
                  label="Schedule"
                  value={
                    mode === "auto-daily"
                      ? `Auto-daily · every day at ${runTime} · ${tz}`
                      : "One-shot · runs when you press Run"
                  }
                />
                <ReviewRow
                  label="Publish"
                  value={autoUpload ? `Auto-upload · ${visibility}` : "Manual upload"}
                />
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

function ChoiceOption({
  active,
  accent,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  accent: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg p-3 text-left",
        active ? "bg-raised" : "bg-raised/40 hover:bg-raised",
      )}
      style={active ? { border: `2px solid ${accent}` } : { border: "1px solid var(--tp-subtle)" }}
    >
      <div className="text-[13px] font-medium">{title}</div>
      <div className="text-[11px] text-text-tertiary mt-0.5">{subtitle}</div>
    </button>
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
