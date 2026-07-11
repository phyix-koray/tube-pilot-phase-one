import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Play,
  Save,
  Undo2,
  RotateCcw,
  Grid2X2,
  Video as VideoIcon,
  Mic,
  Music as MusicIcon,
  Type as TypeIcon,
  Film,
  Boxes,
  Plus,
  Check,
  Clock3,
  UploadCloud,
  Trash2,
} from "lucide-react";
import {
  mockVideos,
  mockScenes,
  mockWorkflows,
  totalDurationSeconds,
  type Scene,
} from "@/mock/data";
import { cn, formatCountdown, formatTimecode } from "@/lib/tp";

export const Route = createFileRoute("/editor/$videoId")({
  loader: ({ params }) => {
    const video = mockVideos.find((v) => v.id === params.videoId);
    if (!video) throw notFound();
    const workflow = mockWorkflows.find((w) => w.id === video.workflowId);
    return { video, workflow };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.video.title} — Editor`
          : "Video Editor",
      },
    ],
  }),
  component: EditorPage,
  notFoundComponent: () => (
    <div className="p-8 text-text-secondary">Video not found.</div>
  ),
});

const PX_PER_SEC = 24;

function EditorPage() {
  const { video, workflow } = Route.useLoaderData();
  const [scenes, setScenes] = useState<Scene[]>(mockScenes);
  const [selectedId, setSelectedId] = useState<string | null>("s003");
  const [subtitles, setSubtitles] = useState(false);
  const [kenBurns, setKenBurns] = useState(true);
  const [mute, setMute] = useState(false);
  const [transitions, setTransitions] = useState(false);
  const [voiceover, setVoiceover] = useState("Per scene");
  const [quality, setQuality] = useState("1080p");
  const [playhead, setPlayhead] = useState(15); // seconds

  const total = useMemo(
    () => scenes.reduce((a, s) => a + s.duration, 0),
    [scenes],
  );
  void totalDurationSeconds;

  const selected = scenes.find((s) => s.id === selectedId) ?? null;

  const updateSelected = (patch: Partial<Scene>) => {
    if (!selectedId) return;
    setScenes((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)),
    );
  };

  const preview = selected ?? scenes[0];

  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col">
      {/* Top toolbar */}
      <div className="h-12 shrink-0 flex items-center gap-3 px-4 bg-raised border-b border-subtle text-[13px]">
        <Link
          to="/videos"
          className="inline-flex items-center gap-2 font-semibold text-[14px]"
        >
          <Grid2X2 className="w-4 h-4 text-blue" />
          Video Editor
        </Link>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="h-7 rounded-md bg-surface border border-subtle px-2 text-[12px]"
        >
          <option>480p</option>
          <option>720p</option>
          <option>1080p</option>
          <option>4K</option>
        </select>
        <span className="w-px h-5 bg-subtle" />

        <ToolbarToggle
          label="Subtitles"
          value={subtitles}
          onChange={setSubtitles}
        />
        <ToolbarToggle
          label="Ken Burns"
          value={kenBurns}
          onChange={setKenBurns}
        />
        <ToolbarToggle
          label="Mute video sound"
          value={mute}
          onChange={setMute}
        />
        <ToolbarToggle
          label="Transitions"
          value={transitions}
          onChange={setTransitions}
        />

        <label className="flex items-center gap-1.5 text-text-secondary">
          <span>Voiceover</span>
          <select
            value={voiceover}
            onChange={(e) => setVoiceover(e.target.value)}
            className="h-7 rounded-md bg-surface border border-subtle px-2 text-[12px]"
          >
            <option>Off</option>
            <option>Per scene</option>
            <option>Continuous</option>
          </select>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button className="h-8 rounded-md bg-surface hover:bg-hover px-3 text-[12px]">
            Save
          </button>
          <button className="h-8 rounded-md bg-surface hover:bg-hover px-3 text-[12px]">
            Export
          </button>
          <button className="h-8 rounded-md bg-blue hover:bg-blue/90 text-white px-3 text-[12px] font-medium">
            Publish
          </button>
        </div>
      </div>

      {/* Breadcrumb + review pill */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-3 flex-wrap">
        <div className="text-[13px] text-text-secondary flex items-center gap-1">
          <Link to="/videos" className="hover:text-text-primary">
            Videos
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-text-primary">{video.title}</span>
        </div>
        {video.status === "pending_review" && video.reviewDeadline && (
          <div className="ml-auto flex items-center gap-2 bg-amber/10 border border-amber/30 rounded-md px-3 py-1.5 text-[12px] text-amber">
            <Clock3 className="w-3.5 h-3.5" />
            <span>
              In Review · Auto-publishes in{" "}
              {formatCountdown(video.reviewDeadline)}
            </span>
            <button className="ml-2 rounded-md bg-amber text-black px-2 h-6 font-medium">
              Approve now
            </button>
            <button className="rounded-md bg-black/30 px-2 h-6">
              Extend 24h
            </button>
          </div>
        )}
      </div>

      {/* Workflow notice */}
      {workflow && video.status === "pending_review" && (
        <div className="mx-6 mb-3 rounded-lg border border-amber/30 bg-amber/10 px-4 py-2.5 flex items-center gap-3 text-[12px]">
          <Film className="w-4 h-4 text-amber shrink-0" />
          <div className="text-amber">
            Generated by <span className="font-medium">{workflow.name}</span> on{" "}
            {new Date(video.createdAt).toLocaleDateString()}. Auto-publishes if
            no action is taken.
          </div>
          <div className="ml-auto flex gap-2">
            <button className="inline-flex items-center gap-1 rounded-md bg-green text-black px-2.5 h-7 font-medium">
              <Check className="w-3.5 h-3.5" />
              Approve & Publish
            </button>
            <button className="rounded-md bg-raised px-2.5 h-7">Extend 24h</button>
            <button className="rounded-md bg-raised px-2.5 h-7 text-red">
              Detach
            </button>
          </div>
        </div>
      )}

      {/* Preview + properties */}
      <div className="px-6 flex gap-4 flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="rounded-xl bg-black overflow-hidden aspect-video border border-subtle relative">
            {preview && (
              <img
                src={preview.imageSrc.replace("/320/180", "/1280/720")}
                alt={preview.label}
                className={cn(
                  "w-full h-full object-cover",
                  kenBurns && "scale-105 transition-transform duration-[8s]",
                )}
              />
            )}
            {subtitles && preview && (
              <div className="absolute bottom-6 inset-x-0 text-center">
                <span className="bg-black/70 text-white text-[15px] font-medium px-3 py-1 rounded">
                  {preview.caption}
                </span>
              </div>
            )}
          </div>

          {/* Playback controls */}
          <div className="mt-3 flex items-center gap-2">
            <button className="inline-flex items-center gap-1 h-9 rounded-full bg-raised hover:bg-hover px-4 text-[13px]">
              <Play className="w-3.5 h-3.5" />
              Play
            </button>
            <button className="inline-flex items-center gap-1 h-9 rounded-full bg-raised hover:bg-hover px-4 text-[13px]">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button className="inline-flex items-center gap-1 h-9 rounded-full bg-raised hover:bg-hover px-4 text-[13px]">
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
            <button className="inline-flex items-center gap-1 h-9 rounded-full bg-raised hover:bg-hover px-4 text-[13px]">
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
            <div className="ml-auto font-mono text-[13px] text-text-secondary">
              {formatTimecode(playhead)} / {formatTimecode(total)}
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <aside className="w-[320px] shrink-0 rounded-xl bg-surface border border-subtle p-4 self-start card-shadow">
          <div className="text-[11px] uppercase tracking-wider text-text-tertiary">
            Selected Clip
          </div>
          <div className="mt-1 h-px bg-subtle" />

          {!selected && (
            <p className="text-[13px] text-text-secondary mt-3">
              Click any clip on the timeline to edit.
            </p>
          )}
          {selected && (
            <div className="mt-3 space-y-4 text-[13px]">
              <div>
                <div className="font-mono text-[12px] text-text-tertiary">
                  {selected.label} — Scene {selected.sceneNumber}
                </div>
                <div className="text-text-secondary">
                  photo — 0:{String(selected.duration).padStart(2, "0")} duration
                </div>
              </div>

              <label className="block">
                <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1">
                  Effect
                </div>
                <select
                  value={selected.effect}
                  onChange={(e) =>
                    updateSelected({ effect: e.target.value as Scene["effect"] })
                  }
                  className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5"
                >
                  <option value="none">No effect</option>
                  <option value="fade-in">Fade In</option>
                  <option value="fade-out">Fade Out</option>
                  <option value="cross-dissolve">Cross Dissolve</option>
                </select>
              </label>

              <label className="block">
                <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1">
                  Duration (seconds)
                </div>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={selected.duration}
                  onChange={(e) =>
                    updateSelected({ duration: Math.min(30, Math.max(1, Number(e.target.value) || 1)) })
                  }
                  className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 font-mono"
                />
              </label>

              <label className="block">
                <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1 flex justify-between">
                  <span>Volume</span>
                  <span className="font-mono">
                    {Math.round(selected.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={selected.volume}
                  onChange={(e) =>
                    updateSelected({ volume: Number(e.target.value) })
                  }
                  className="w-full accent-blue"
                />
              </label>

              <div>
                <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1">
                  Image prompt
                </div>
                <p className="text-text-secondary text-[12px] italic">
                  "{selected.imagePrompt}"
                </p>
                <button className="mt-2 text-[12px] text-blue">
                  Regenerate
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-subtle">
                <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-raised hover:bg-hover h-8">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Replace image
                </button>
                <button className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover h-8 px-2.5 text-red">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Timeline */}
      <Timeline
        scenes={scenes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        playhead={playhead}
        onScrub={setPlayhead}
        total={total}
        subtitles={subtitles}
      />
    </div>
  );
}

function ToolbarToggle({
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
      onClick={() => onChange(!value)}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px]",
        value
          ? "bg-blue/20 text-blue"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          value ? "bg-blue" : "bg-text-tertiary",
        )}
      />
      {label}
    </button>
  );
}

function Timeline({
  scenes,
  selectedId,
  onSelect,
  playhead,
  onScrub,
  total,
  subtitles,
}: {
  scenes: Scene[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  playhead: number;
  onScrub: (v: number) => void;
  total: number;
  subtitles: boolean;
}) {
  const width = Math.max(total * PX_PER_SEC, 800);

  // Cumulative offsets
  const clips = scenes.reduce<
    Array<{ scene: Scene; start: number; width: number }>
  >((acc, s) => {
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].width : 0;
    return [...acc, { scene: s, start: start / PX_PER_SEC ? start : start, width: s.duration * PX_PER_SEC }];
  }, []);

  const tracks: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    render: (w: number) => React.ReactNode;
  }> = [
    {
      icon: VideoIcon,
      label: "Video",
      render: () => (
        <div className="relative h-10">
          {clips.map(({ scene, start, width: w }) => (
            <button
              key={scene.id}
              onClick={() => onSelect(scene.id)}
              className={cn(
                "absolute top-1 h-8 rounded-md overflow-hidden border transition-colors",
                selectedId === scene.id
                  ? "border-blue"
                  : "border-blue/30 hover:border-blue/60",
              )}
              style={{
                left: start,
                width: w - 2,
                background: "rgba(10,132,255,0.25)",
              }}
              title={scene.label}
            >
              <img
                src={scene.imageSrc}
                alt=""
                className="w-full h-full object-cover opacity-60"
              />
              <span className="absolute top-0.5 left-1 font-mono text-[10px] text-white/90">
                {scene.label}
              </span>
            </button>
          ))}
        </div>
      ),
    },
    {
      icon: Mic,
      label: "Voiceover",
      render: () => (
        <div className="relative h-10">
          {clips.map(({ scene, start, width: w }) => (
            <div
              key={scene.id}
              className="absolute top-1 h-8 rounded-md text-[10px] font-mono text-green flex items-center px-2 overflow-hidden"
              style={{
                left: start,
                width: w - 2,
                background: "rgba(48,209,88,0.2)",
                border: "1px solid rgba(48,209,88,0.3)",
              }}
            >
              VO {scene.sceneNumber}.{scene.label}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: MusicIcon,
      label: "Music",
      render: (w) => <EmptyTrack width={w} label="Drag files or click +" />,
    },
    {
      icon: MusicIcon,
      label: "SFX",
      render: (w) => <EmptyTrack width={w} label="Drag files or click +" />,
    },
    {
      icon: TypeIcon,
      label: "Text/Captions",
      render: () =>
        subtitles ? (
          <div className="relative h-10">
            {clips.map(({ scene, start, width: w }) => (
              <div
                key={scene.id}
                className="absolute top-1 h-8 rounded-md text-[10px] text-amber flex items-center px-2 truncate"
                style={{
                  left: start,
                  width: w - 2,
                  background: "rgba(255,214,10,0.2)",
                  border: "1px solid rgba(255,214,10,0.3)",
                }}
              >
                {scene.caption}
              </div>
            ))}
          </div>
        ) : (
          <EmptyTrack width={width} label="Enable Subtitles to add captions" />
        ),
    },
    {
      icon: Film,
      label: "B-Roll",
      render: (w) => <EmptyTrack width={w} label="Drag files or click +" />,
    },
    {
      icon: Boxes,
      label: "Custom 1",
      render: (w) => <EmptyTrack width={w} label="Empty" />,
    },
  ];

  return (
    <div className="mt-4 border-t border-subtle bg-surface">
      <div className="flex items-center justify-between px-6 py-2 text-[11px] uppercase tracking-wider text-text-tertiary">
        <span>Timeline</span>
        <span className="font-mono text-text-secondary">
          {formatTimecode(total)}
        </span>
      </div>

      <div className="flex">
        <div className="w-[160px] shrink-0 border-r border-subtle">
          <div className="h-6" />
          {tracks.map((t) => (
            <div
              key={t.label}
              className="h-11 px-3 flex items-center gap-2 text-[12px] text-text-secondary border-t border-subtle"
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="flex-1 truncate">{t.label}</span>
              <button className="text-text-tertiary hover:text-text-primary">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div
          className="flex-1 overflow-x-auto relative"
          onClick={(e) => {
            const target = e.currentTarget;
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left + target.scrollLeft;
            onScrub(Math.max(0, Math.min(total, x / PX_PER_SEC)));
          }}
        >
          <div style={{ width, minWidth: "100%" }} className="relative">
            {/* ruler */}
            <div className="h-6 relative border-b border-subtle">
              {Array.from({ length: Math.ceil(total) + 1 }).map((_, i) => {
                const isMajor = i % 5 === 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute top-0 border-l border-subtle",
                      isMajor ? "h-4" : "h-2",
                    )}
                    style={{ left: i * PX_PER_SEC }}
                  >
                    {isMajor && (
                      <span className="absolute top-2.5 left-1 font-mono text-[10px] text-text-tertiary">
                        {i}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {tracks.map((t) => (
              <div
                key={t.label}
                className="h-11 border-t border-subtle relative"
              >
                {t.render(width)}
              </div>
            ))}

            {/* playhead */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red pointer-events-none"
              style={{ left: playhead * PX_PER_SEC }}
            >
              <div className="absolute -top-1 -left-[5px] w-2.5 h-2.5 rotate-45 bg-red" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-3 border-t border-subtle">
        <button className="inline-flex items-center gap-1.5 rounded-md bg-raised hover:bg-hover px-3 h-8 text-[13px]">
          <Plus className="w-3.5 h-3.5" />
          Add track
        </button>
      </div>
    </div>
  );
}

function EmptyTrack({ width, label }: { width: number; label: string }) {
  return (
    <div
      className="h-10 flex items-center px-3 text-[11px] text-text-tertiary border border-dashed border-subtle m-1 rounded-md"
      style={{ width: width - 8 }}
    >
      {label}
    </div>
  );
}
