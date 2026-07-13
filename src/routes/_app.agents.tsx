import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  ChevronLeft,
  Play,
  Plus,
  Search,
  X,
  CheckCircle2,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  mockChannels,
  mockVideos,
  mockWorkflows,
  statusLeftBorder,
  type Workflow,
} from "@/mock/data";
import { cn } from "@/lib/tp";
import { StepBar, type Step } from "@/components/StepFlow";

export const Route = createFileRoute("/_app/agents")({
  head: () => ({
    meta: [
      { title: "Agents — TubePilot" },
      {
        name: "description",
        content: "Your AI agents that produce and publish videos on autopilot.",
      },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const [q, setQ] = useState("");
  const [runTarget, setRunTarget] = useState<Workflow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pending = mockVideos.filter((v) => v.status === "pending_review");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return mockWorkflows;
    return mockWorkflows.filter(
      (w) =>
        w.name.toLowerCase().includes(needle) ||
        w.description.toLowerCase().includes(needle),
    );
  }, [q]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-[13px]">
          <span className="text-amber">
            {pending.length} video{pending.length > 1 ? "s" : ""} awaiting your
            review before publishing.
          </span>
          <Link to="/videos" className="text-amber font-medium hover:underline">
            Review now →
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight">Agents</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="h-9 w-64 rounded-lg bg-surface border border-subtle pl-8 pr-3 text-[13px] placeholder:text-text-tertiary"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium">
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-text-primary mb-3">
          Your agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <AgentCard key={w.id} w={w} onUse={() => setRunTarget(w)} />
          ))}
        </div>
      </div>

      {runTarget && (
        <RunAgentWizard
          agent={runTarget}
          onClose={() => setRunTarget(null)}
          onDone={(msg) => {
            setToast(msg);
            setRunTarget(null);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-text-primary text-[color:var(--tp-base)] px-4 py-3 text-[13px] font-medium card-shadow">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  );
}

function AgentCard({ w, onUse }: { w: Workflow; onUse: () => void }) {
  const accent = w.accent ?? "var(--tp-subtle)";
  return (
    <div
      className={cn(
        "group rounded-xl bg-surface overflow-hidden card-shadow transition-transform hover:-translate-y-0.5",
        statusLeftBorder(w.status),
      )}
      style={{ border: `2px solid ${accent}` }}
    >
      <div className="flex items-center gap-3 px-5 pt-5">
        <div
          className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{ backgroundColor: accent }}
        >
          {w.avatar ? (
            <img src={w.avatar} alt="" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-text-primary truncate">
            {w.name}
          </div>
          <div className="text-[11px] text-text-tertiary">
            {w.steps.length} steps · Last run: {w.lastRun ?? "—"}
          </div>
        </div>
      </div>

      <p className="px-5 mt-3 text-[13px] text-text-secondary line-clamp-2">
        {w.description}
      </p>

      <div className="mt-5 border-t border-subtle bg-raised/40 flex items-center justify-between px-3 py-2">
        <button
          onClick={onUse}
          className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3 h-8 text-[13px] font-medium"
        >
          <Play className="w-3.5 h-3.5" />
          Use agent
        </button>
        <Link
          to="/agents/$agentId"
          params={{ agentId: w.id }}
          className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary px-2 h-8"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Configure <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
 * Run Agent — step-by-step wizard modal
 * ============================================================ */

const SUGGESTED_THEME =
  "Thin winter rain taps against the tall windows of a softly lit Seoul hanok guesthouse as a slow saxophone hums through the paper-screened rooms, its melody curling like steam rising from a clay teapot into the grey afternoon stillness.";
const SUGGESTED_TAGS =
  "slow jazz, soprano saxophone, Korean traditional hanok, rainy afternoon, clay teapot ambiance, paper screen acoustics, Seoul winter, meditative tempo, smoky intimacy";

function RunAgentWizard({
  agent,
  onClose,
  onDone,
}: {
  agent: Workflow;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const navigate = useNavigate();
  const accent = agent.accent ?? "var(--tp-subtle)";
  const isMusic = agent.id === "music-composer";

  const suggestedChannel =
    mockChannels.find((c) => c.usedIn?.includes(agent.name)) ?? mockChannels[0];

  const [channelId, setChannelId] = useState(suggestedChannel.id);

  // Generic
  const [prompt, setPrompt] = useState(
    isMusic
      ? "slow smooth jazz, saxophone, cozy ambient lounge"
      : agent.id === "ai-video-generator"
        ? "The Dam That Never Cracked — a 3-minute short doc about the Houston dam."
        : "Top 5 underrated moments of the last World Cup.",
  );

  // Music-specific — matches Suno terminal flow
  const [theme, setTheme] = useState(SUGGESTED_THEME);
  const [tags, setTags] = useState(SUGGESTED_TAGS);
  const [songsPerRun, setSongsPerRun] = useState(2);
  const [mergeRepeats, setMergeRepeats] = useState(2);
  const [instrumental, setInstrumental] = useState(true);
  const [makeThumbnail, setMakeThumbnail] = useState(true);
  const [outputMode, setOutputMode] = useState<"gorsel" | "gorsel-video">("gorsel");
  const [autoUpload, setAutoUpload] = useState(true);
  const [visibility, setVisibility] = useState<"unlisted" | "public" | "private">("unlisted");

  // Schedule — default to daily recurring
  const [mode, setMode] = useState<"one-shot" | "daily" | "weekly">("daily");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState("14:30");
  const [tz, setTz] = useState("Europe/Istanbul|+03:00");
  const [weeklyDay, setWeeklyDay] = useState("Mon");

  // Image guideline (skill) — auto-drafted from theme, editable
  const [imageGuideline, setImageGuideline] = useState<string>("");
  const [guidelineTouched, setGuidelineTouched] = useState(false);

  // Recurring theme (daily/weekly)
  const [themeSource, setThemeSource] = useState<"manual" | "channel">("channel");
  const [channelRef, setChannelRef] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<string | null>(null);
  const [manualTheme, setManualTheme] = useState("");

  // Video length (all music runs)
  const LENGTH_OPTIONS = [
    { key: "1-3m", label: "1–3 min" },
    { key: "3-5m", label: "3–5 min" },
    { key: "5-10m", label: "5–10 min" },
    { key: "10-20m", label: "10–20 min" },
    { key: "20-30m", label: "20–30 min" },
    { key: "30-60m", label: "30–60 min" },
    { key: "1-3h", label: "1–3 hours" },
    { key: "3-6h", label: "3–6 hours" },
    { key: "6-12h", label: "6–12 hours" },
    { key: "12-24h", label: "12–24 hours" },
  ] as const;
  const [videoLength, setVideoLength] = useState<string>("5-10m");

  const isRecurring = mode === "daily" || mode === "weekly";

  const RUN_STEPS: Step[] = isMusic
    ? [
        { key: "channel", title: "Channel" },
        { key: "schedule", title: "Schedule" },
        ...(isRecurring
          ? [{ key: "theme", title: "Theme" } as Step]
          : [{ key: "content", title: "Content" } as Step]),
        { key: "length", title: "Video length" },
        { key: "media", title: "Media" },
        { key: "publishing", title: "Publishing" },
        { key: "review", title: "Review" },
      ]
    : [
        { key: "channel", title: "Channel" },
        { key: "inputs", title: "Inputs" },
        { key: "schedule", title: "Schedule" },
        { key: "review", title: "Review" },
      ];

  const [step, setStep] = useState(0);
  const clampedStep = Math.min(step, RUN_STEPS.length - 1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const channel = mockChannels.find((c) => c.id === channelId)!;
  const totalTracks = songsPerRun * mergeRepeats;
  const effectiveTheme = isRecurring
    ? themeSource === "channel"
      ? (analyzed ?? `Pending analysis of ${channelRef || "…"}`)
      : manualTheme || "(manual theme not set)"
    : theme;
  const lengthLabel =
    LENGTH_OPTIONS.find((o) => o.key === videoLength)?.label ?? videoLength;

  const analyze = () => {
    if (!channelRef.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzed(
        `Long-form lo-fi and ambient jazz for late-night study sessions, echoing the mood of "${channelRef.trim()}" — warm tape textures, rainy-window atmospherics, minimal vocals.`,
      );
      setAnalyzing(false);
    }, 900);
  };

  const next = () => setStep((s) => Math.min(s + 1, RUN_STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const start = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setDone(true);
    }, 900);
  };

  const stepKey = RUN_STEPS[clampedStep].key;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-surface card-shadow overflow-hidden max-h-[92vh] flex flex-col"
        style={{ border: `2px solid ${accent}` }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-hover flex items-center justify-center text-text-secondary z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5">
          <div
            className="w-11 h-11 rounded-full overflow-hidden shrink-0"
            style={{ backgroundColor: accent }}
          >
            {agent.avatar && (
              <img
                src={agent.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate">
              Run {agent.name}
            </div>
            <div className="text-[11px] text-text-tertiary">
              {agent.steps.length}-step pipeline
            </div>
          </div>
        </div>

        {/* Stepper */}
        {!done && (
          <div className="px-5 mt-5">
            <StepBar steps={RUN_STEPS} current={clampedStep} accent={accent} onJump={setStep} />
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-5 min-h-[240px] overflow-y-auto flex-1">
          {done ? (
            <div className="text-center py-6">
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: accent }}
              >
                <CheckCircle2 className="w-7 h-7 text-black" />
              </div>
              <div className="mt-4 text-[16px] font-semibold">
                {agent.name} started
              </div>
              <p className="text-[13px] text-text-secondary mt-1">
                Your new video will appear in{" "}
                <Link to="/videos" className="text-blue hover:underline">
                  Videos
                </Link>{" "}
                as soon as it's ready for review.
              </p>
            </div>
          ) : stepKey === "channel" ? (
            <div className="space-y-3">
              <div className="text-[13px] text-text-secondary">
                Which channel should this run publish to?
              </div>
              <div className="space-y-2">
                {mockChannels.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-3 cursor-pointer",
                      channelId === c.id ? "bg-raised" : "bg-raised/40 hover:bg-raised",
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
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: c.color + "22", color: c.color }}
                    >
                      {c.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium truncate">{c.name}</div>
                      <div className="text-[11px] text-text-tertiary truncate">
                        {c.niche || "No niche set"}
                      </div>
                    </div>
                    {c.usedIn?.includes(agent.name) && (
                      <span className="text-[10px] uppercase tracking-wide rounded-md bg-raised px-1.5 py-0.5 text-text-secondary">
                        Suggested
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ) : stepKey === "content" && isMusic ? (
            <div className="space-y-4">
              <div className="text-[12px] text-text-tertiary">
                One-shot run — set the exact theme and Suno keywords for this single video.
              </div>
              <Field label="AI-suggested theme">
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => setTheme(SUGGESTED_THEME)}
                    className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
                  >
                    <Sparkles className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[13px] resize-none"
                />
              </Field>
              <Field label="First Suno keyword set">
                <textarea
                  rows={2}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[12px] font-mono resize-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Songs per run">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={songsPerRun}
                    onChange={(e) => setSongsPerRun(Number(e.target.value) || 1)}
                    className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
                  />
                </Field>
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
              </div>
              <div className="text-[11px] text-text-tertiary rounded-md bg-raised/60 border border-subtle p-2.5">
                → {songsPerRun} songs × {mergeRepeats} loops = <b>{totalTracks}</b> tracks in the merged file.
              </div>
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
          ) : stepKey === "theme" && isMusic ? (
            <div className="space-y-4">
              <div className="text-[12px] text-text-tertiary">
                Recurring run — pick a stable theme so every scheduled video stays on-brand.
              </div>
              <Field label="Theme source">
                <div className="grid grid-cols-2 gap-2">
                  <ChoiceOption
                    active={themeSource === "channel"}
                    accent={accent}
                    title="Analyze a YouTube channel"
                    subtitle="AI detects the channel's theme"
                    onClick={() => setThemeSource("channel")}
                  />
                  <ChoiceOption
                    active={themeSource === "manual"}
                    accent={accent}
                    title="Write it manually"
                    subtitle="Full creative control"
                    onClick={() => setThemeSource("manual")}
                  />
                </div>
              </Field>

              {themeSource === "channel" ? (
                <>
                  <Field label="YouTube channel name or URL">
                    <div className="flex gap-2">
                      <input
                        value={channelRef}
                        onChange={(e) => {
                          setChannelRef(e.target.value);
                          setAnalyzed(null);
                        }}
                        placeholder="@lofigirl  or  https://youtube.com/@lofigirl"
                        className="flex-1 h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
                      />
                      <button
                        type="button"
                        onClick={analyze}
                        disabled={!channelRef.trim() || analyzing}
                        className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 disabled:opacity-60 px-3 h-9 text-[13px] font-medium"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {analyzing ? "Analyzing…" : "Analyze"}
                      </button>
                    </div>
                  </Field>
                  {analyzed && (
                    <div
                      className="rounded-md bg-raised p-3 text-[13px] whitespace-pre-wrap"
                      style={{ border: `2px solid ${accent}` }}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1">
                        Detected theme
                      </div>
                      {analyzed}
                    </div>
                  )}
                </>
              ) : (
                <Field label="Channel theme">
                  <textarea
                    rows={5}
                    value={manualTheme}
                    onChange={(e) => setManualTheme(e.target.value)}
                    placeholder="e.g. Late-night lo-fi jazz for study sessions — warm tape textures, rainy-window atmosphere, minimal vocals."
                    className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[13px] resize-none"
                  />
                </Field>
              )}
            </div>
          ) : stepKey === "length" && isMusic ? (
            <div className="space-y-3">
              <div className="text-[12px] text-text-tertiary">
                How long should each published video be? Ranges up to 24 hours.
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LENGTH_OPTIONS.map((o) => (
                  <ChoiceOption
                    key={o.key}
                    active={videoLength === o.key}
                    accent={accent}
                    title={o.label}
                    subtitle=""
                    onClick={() => setVideoLength(o.key)}
                  />
                ))}
              </div>
            </div>
          ) : stepKey === "inputs" ? (
            <div className="space-y-3">
              <div className="text-[13px] text-text-secondary">
                Give this run a topic or brief.
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="w-full rounded-md bg-raised border border-subtle p-3 text-[13px] resize-none"
              />
              <div className="text-[11px] text-text-tertiary">
                Tip: leave this as-is to reuse the saved defaults from Configure.
              </div>
            </div>
          ) : stepKey === "media" ? (
            <div className="space-y-4">
              <div
                className={cn(
                  "rounded-lg p-3.5",
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
                      GPT Image renders a cinematic still matching the day's theme. You'll approve it before render.
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
              <div className="text-[11px] text-text-tertiary rounded-md bg-raised/60 border border-subtle p-2.5">
                Renders through YT Music Combiner with Fade In on the first clip.
              </div>
            </div>
          ) : stepKey === "schedule" ? (
            <div className="space-y-4">
              {isMusic ? (
                <>
                  <Field label="Run mode">
                    <div className="grid grid-cols-3 gap-2">
                      <ChoiceOption
                        active={mode === "one-shot"}
                        accent={accent}
                        title="One-shot"
                        subtitle="Runs once, then stops"
                        onClick={() => setMode("one-shot")}
                      />
                      <ChoiceOption
                        active={mode === "daily"}
                        accent={accent}
                        title="Daily"
                        subtitle="Every day at a fixed time"
                        onClick={() => setMode("daily")}
                      />
                      <ChoiceOption
                        active={mode === "weekly"}
                        accent={accent}
                        title="Weekly"
                        subtitle="Once per week"
                        onClick={() => setMode("weekly")}
                      />
                    </div>
                  </Field>

                  {mode === "one-shot" && (
                    <Field label="When">
                      <div className="grid grid-cols-2 gap-2">
                        <ChoiceOption
                          active={when === "now"}
                          accent={accent}
                          title="Run now"
                          subtitle="Starts immediately"
                          onClick={() => setWhen("now")}
                        />
                        <ChoiceOption
                          active={when === "later"}
                          accent={accent}
                          title="Schedule"
                          subtitle="Pick a time today"
                          onClick={() => setWhen("later")}
                        />
                      </div>
                    </Field>
                  )}

                  {mode === "weekly" && (
                    <Field label="Day of week">
                      <Select value={weeklyDay} onChange={setWeeklyDay}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                </>
              ) : (
                <Field label="When">
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceOption
                      active={when === "now"}
                      accent={accent}
                      title="Run now"
                      subtitle="Starts immediately"
                      onClick={() => setWhen("now")}
                    />
                    <ChoiceOption
                      active={when === "later"}
                      accent={accent}
                      title="Schedule"
                      subtitle="Pick a time today"
                      onClick={() => setWhen("later")}
                    />
                  </div>
                </Field>
              )}

              {(isRecurring || (!isMusic && when === "later") || (isMusic && mode === "one-shot" && when === "later")) && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={isRecurring ? "Run time" : "Time (local)"}>
                    <input
                      type="time"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
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
              )}
            </div>
          ) : stepKey === "publishing" ? (
            <div className="space-y-4">
              <div
                className={cn(
                  "rounded-lg p-3.5",
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
                      Auto-upload to YouTube when render finishes
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      First upload asks for Google permission once, then keeps a saved session.
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
            </div>
          ) : (
            /* review */
            <div className="space-y-3">
              <div className="text-[13px] text-text-secondary">
                Review and confirm this run.
              </div>
              <div className="rounded-lg bg-raised border border-subtle divide-y divide-subtle text-[13px]">
                <ReviewRow label="Agent" value={agent.name} />
                <ReviewRow
                  label="Channel"
                  value={`${channel.name} ${channel.emoji}`}
                />
                {isMusic ? (
                  <>
                    <ReviewRow
                      label="Schedule"
                      value={
                        mode === "daily"
                          ? `Daily · every day at ${scheduleAt} ${tz}`
                          : mode === "weekly"
                            ? `Weekly · every ${weeklyDay} at ${scheduleAt} ${tz}`
                            : when === "now"
                              ? "One-shot · run immediately"
                              : `One-shot · today ${scheduleAt} ${tz}`
                      }
                    />
                    <ReviewRow label="Theme" value={effectiveTheme} multiline />
                    {!isRecurring && <ReviewRow label="Tags" value={tags} multiline />}
                    <ReviewRow label="Video length" value={lengthLabel} />
                    {!isRecurring && (
                      <ReviewRow
                        label="Suno"
                        value={`${songsPerRun} songs × ${mergeRepeats} loops (${totalTracks} tracks) · ${instrumental ? "Instrumental" : "With vocals"}`}
                      />
                    )}
                    <ReviewRow
                      label="Media"
                      value={`${makeThumbnail ? "Thumbnail on" : "Thumbnail off"} · ${outputMode === "gorsel" ? "Image only" : "Image + video"}`}
                    />
                    <ReviewRow
                      label="Publish"
                      value={autoUpload ? `Auto-upload · ${visibility}` : "Manual upload"}
                    />
                  </>
                ) : (
                  <>
                    <ReviewRow label="Brief" value={prompt} multiline />
                    <ReviewRow
                      label="Schedule"
                      value={when === "now" ? "Immediately" : `Today ${scheduleAt}`}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-subtle bg-raised/40 flex items-center justify-between px-3 py-2">
          {done ? (
            <>
              <button
                onClick={() =>
                  navigate({
                    to: "/agents/$agentId",
                    params: { agentId: agent.id },
                  })
                }
                className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary px-2 h-8"
              >
                Open agent
              </button>
              <button
                onClick={() => onDone(`${agent.name} started.`)}
                className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3 h-8 text-[13px] font-medium"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={clampedStep === 0 ? onClose : prev}
                className="inline-flex items-center gap-1 rounded-md hover:bg-hover px-2.5 h-8 text-[13px] text-text-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
                {clampedStep === 0 ? "Cancel" : "Back"}
              </button>
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-text-tertiary">
                  Step {clampedStep + 1} of {RUN_STEPS.length}
                </div>
                {clampedStep < RUN_STEPS.length - 1 ? (
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3 h-8 text-[13px] font-medium"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={start}
                    disabled={running}
                    className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 disabled:opacity-60 px-3 h-8 text-[13px] font-medium"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {running
                      ? "Starting…"
                      : isMusic && isRecurring
                        ? mode === "daily"
                          ? "Start daily"
                          : "Start weekly"
                        : when === "now"
                          ? "Run now"
                          : "Schedule"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
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
      <div className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-text-tertiary pt-0.5">
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
