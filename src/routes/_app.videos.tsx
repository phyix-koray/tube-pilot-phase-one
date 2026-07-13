import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Upload,
  Pencil,
  Trash2,
  Search,
  RefreshCcw,
  Video as VideoIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";
import {
  mockVideos,
  mockChannels,
  type VideoStatus,
  type Channel,
} from "@/mock/data";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/videos")({
  head: () => ({
    meta: [
      { title: "Videos — TubePilot" },
      {
        name: "description",
        content: "Track videos across all your channels in one place.",
      },
    ],
  }),
  component: VideosPage,
});

const statusPill: Record<
  VideoStatus,
  { label: string; className: string }
> = {
  published: {
    label: "Live",
    className: "bg-green/15 text-green border border-green/30",
  },
  pending_review: {
    label: "Pending",
    className: "bg-amber/15 text-amber border border-amber/30",
  },
  publishing: {
    label: "Uploading",
    className: "bg-blue/15 text-blue border border-blue/30",
  },
  draft: {
    label: "Draft",
    className: "bg-raised text-text-secondary border border-subtle",
  },
  failed: {
    label: "Failed",
    className: "bg-red/15 text-red border border-red/30",
  },
};

function VideosPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState<VideoStatus | "all">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      mockVideos.filter(
        (v) =>
          (channel === "all" || v.channelId === channel) &&
          (status === "all" || v.status === status) &&
          (q.trim() === "" ||
            v.title.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [channel, status, q],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Videos</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Track videos across all your channels in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setToast("Synced with YouTube.")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-subtle hover:bg-hover px-3.5 h-9 text-[13px] font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            Sync with YouTube
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue text-white hover:opacity-90 px-3.5 h-9 text-[13px] font-medium"
          >
            <Upload className="w-4 h-4" />
            New video
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title..."
            className="w-full h-9 rounded-lg bg-surface border border-subtle pl-8 pr-3 text-[13px] placeholder:text-text-tertiary"
          />
        </div>
        <FilterSelect
          value={channel}
          onChange={setChannel}
          options={[
            ["all", "All channels"],
            ...mockChannels.map((c) => [c.id, c.name] as [string, string]),
          ]}
        />
        <FilterSelect
          value={status}
          onChange={(v) => setStatus(v as VideoStatus | "all")}
          options={[
            ["all", "All statuses"],
            ["publishing", "Uploading"],
            ["pending_review", "Pending"],
            ["published", "Live"],
            ["failed", "Failed"],
            ["draft", "Draft"],
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-surface border border-subtle overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_120px_120px_80px] gap-3 px-4 py-2.5 border-b border-subtle bg-raised/40 text-[11px] uppercase tracking-wide text-text-tertiary">
          <div>Video</div>
          <div>Channel</div>
          <div>Status</div>
          <div>Date</div>
          <div className="text-right">·</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <VideoIcon className="w-8 h-8 mx-auto text-text-tertiary" />
            <div className="mt-3 text-[14px] font-semibold">No videos yet</div>
            <div className="text-[12px] text-text-secondary">
              Upload manually or let an agent produce one.
            </div>
          </div>
        ) : (
          filtered.map((v) => {
            const ch = mockChannels.find((c) => c.id === v.channelId);
            const meta = statusPill[v.status];
            return (
              <div
                key={v.id}
                className="grid grid-cols-[1.6fr_1fr_120px_120px_80px] gap-3 items-center px-4 py-3 border-b border-subtle last:border-0 hover:bg-hover/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-9 rounded-md bg-raised border border-subtle flex items-center justify-center text-text-tertiary shrink-0">
                    <VideoIcon className="w-4 h-4" />
                  </div>
                  <div className="text-[13px] font-medium truncate">
                    {v.title}
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px]"
                    style={{ backgroundColor: (ch?.color ?? "#999") + "22" }}
                  >
                    {ch?.emoji}
                  </div>
                  <div className="text-[13px] truncate">{ch?.name ?? "—"}</div>
                </div>
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                      meta.className,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="text-[12px] text-text-secondary font-mono">
                  {new Date(v.createdAt).toLocaleDateString([], {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() =>
                      navigate({
                        to: "/videos/$videoId",
                        params: { videoId: v.id },
                      })
                    }
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-hover text-text-secondary hover:text-text-primary"
                    aria-label="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-red/10 text-red"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {uploadOpen && (
        <UploadWizard
          onClose={() => setUploadOpen(false)}
          onDone={() => {
            setUploadOpen(false);
            setToast("Video queued for upload.");
            setTimeout(() => setToast(null), 3200);
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

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg bg-surface border border-subtle text-[13px] px-2.5"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

/* -------------------------------------------------------------
 * Upload Wizard: Channel → File → Metadata → Schedule
 * ----------------------------------------------------------- */

const STEPS = ["Channel", "File", "Metadata", "Schedule"] as const;

function UploadWizard({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [channelId, setChannelId] = useState(mockChannels[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [category, setCategory] = useState("People & Blogs");
  const [privacy, setPrivacy] = useState<"private" | "unlisted" | "public">(
    "private",
  );
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [scheduleOn, setScheduleOn] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  const channel = mockChannels.find((c) => c.id === channelId);

  const canNext = () => {
    if (step === 0) return !!channelId;
    if (step === 1) return !!fileName;
    if (step === 2) return title.trim().length > 0;
    return true;
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface border border-subtle card-shadow overflow-hidden max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-hover flex items-center justify-center text-text-secondary z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-5 pt-5">
          <div className="text-[18px] font-semibold">Upload video</div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            Pick a channel, upload the file, and fill in the publishing details.
          </div>
        </div>

        {/* Stepper */}
        <div className="px-5 mt-5">
          <div className="flex items-center">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium border",
                        done
                          ? "bg-blue border-blue text-white"
                          : active
                            ? "bg-surface border-blue text-blue"
                            : "bg-raised border-subtle text-text-tertiary",
                      )}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <div
                      className={cn(
                        "text-[13px]",
                        active ? "text-text-primary font-medium" : "text-text-secondary",
                      )}
                    >
                      {label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px bg-subtle mx-3" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto flex-1">
          {step === 0 && (
            <div className="space-y-2">
              <div className="text-[12px] uppercase tracking-wide text-text-tertiary mb-1">
                Pick a channel
              </div>
              {mockChannels.map((c) => (
                <ChannelPickRow
                  key={c.id}
                  c={c}
                  active={channelId === c.id}
                  onClick={() => setChannelId(c.id)}
                />
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="text-[12px] uppercase tracking-wide text-text-tertiary">
                Video file
              </div>
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer text-center",
                  fileName ? "border-blue bg-blue/5" : "border-subtle hover:bg-hover/40",
                )}
              >
                <UploadCloud className="w-8 h-8 text-text-tertiary" />
                <div className="text-[14px] font-medium">
                  {fileName ?? "Drag & drop or click to select"}
                </div>
                <div className="text-[11px] text-text-tertiary">
                  MP4 / MOV / WEBM, up to 128 GB
                </div>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFileName(f.name);
                  }}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Title" counter={`${title.length}/100`}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  placeholder="A compelling title..."
                  className="w-full h-10 rounded-lg bg-raised border border-subtle px-3 text-[13px]"
                />
              </Field>
              <Field label="Description" counter={`${description.length}/5000`}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                  rows={5}
                  placeholder="About this video..."
                  className="w-full rounded-lg bg-raised border border-subtle px-3 py-2.5 text-[13px] resize-none"
                />
              </Field>
              <Field label="Tags">
                <div className="rounded-lg bg-raised border border-subtle px-2.5 py-1.5 flex flex-wrap gap-1.5 min-h-[40px]">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-surface border border-subtle px-2 py-0.5 text-[12px]"
                    >
                      {t}
                      <button
                        onClick={() =>
                          setTags((prev) => prev.filter((x) => x !== t))
                        }
                        className="text-text-tertiary hover:text-red"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Press Enter to add..."
                    className="flex-1 min-w-[120px] bg-transparent text-[13px] outline-none py-1"
                  />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Language">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-10 rounded-lg bg-raised border border-subtle px-3 text-[13px]"
                  >
                    {["English", "Turkish", "Spanish", "German", "Japanese"].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Category">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-lg bg-raised border border-subtle px-3 text-[13px]"
                  >
                    {[
                      "People & Blogs",
                      "Music",
                      "Education",
                      "Entertainment",
                      "News & Politics",
                      "Gaming",
                    ].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Privacy">
                <div className="grid grid-cols-3 gap-2">
                  {(["private", "unlisted", "public"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrivacy(p)}
                      className={cn(
                        "rounded-full h-10 text-[13px] font-medium capitalize border",
                        privacy === p
                          ? "bg-blue text-white border-blue"
                          : "bg-surface border-subtle hover:bg-hover",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Thumbnail (optional)">
                <label className="flex items-center justify-center rounded-lg border-2 border-dashed border-subtle p-4 cursor-pointer hover:bg-hover/40 text-[13px] text-text-secondary">
                  {thumbnail ?? "Choose image (JPG/PNG)"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setThumbnail(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-subtle bg-raised/40 p-4">
                <div className="text-[14px] font-semibold">Publish time</div>
                <div className="text-[12px] text-text-secondary">
                  Publish now, or schedule for a future date.
                </div>
                <label className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-subtle bg-surface p-3 cursor-pointer">
                  <div>
                    <div className="text-[13px] font-medium">Schedule for later</div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      Video uploads as private and goes public automatically at the scheduled time.
                    </div>
                  </div>
                  <Toggle
                    checked={scheduleOn}
                    onChange={setScheduleOn}
                  />
                </label>
                {scheduleOn && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Field label="Date">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-10 rounded-lg bg-surface border border-subtle px-3 text-[13px]"
                      />
                    </Field>
                    <Field label="Time">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full h-10 rounded-lg bg-surface border border-subtle px-3 text-[13px] font-mono"
                      />
                    </Field>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-subtle bg-raised/40 p-4">
                <div className="text-[11px] uppercase tracking-wide text-text-tertiary">
                  Summary
                </div>
                <div className="mt-2 space-y-1 text-[13px]">
                  <div>
                    <span className="text-text-tertiary">Title:</span>{" "}
                    <span className="font-medium">{title || "—"}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Channel:</span>{" "}
                    <span className="font-medium">{channel?.name}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Privacy:</span>{" "}
                    <span className="font-medium capitalize">{privacy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-subtle bg-raised/40 flex items-center justify-between px-4 py-2.5">
          <button
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1 rounded-md hover:bg-hover px-2.5 h-8 text-[13px] text-text-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue text-white hover:opacity-90 disabled:opacity-40 px-4 h-9 text-[13px] font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onDone}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue text-white hover:opacity-90 px-4 h-9 text-[13px] font-medium"
            >
              Save and upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelPickRow({
  c,
  active,
  onClick,
}: {
  c: Channel;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg p-3 text-left border",
        active
          ? "border-blue bg-blue/5"
          : "border-subtle bg-raised/40 hover:bg-raised",
      )}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: c.color + "22", color: c.color }}
      >
        {c.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium truncate">{c.name}</div>
        <div className="text-[11px] text-text-tertiary truncate">
          {c.subscribers.toLocaleString()} subscribers · {c.niche || "No niche"}
        </div>
      </div>
      {active && <Check className="w-4 h-4 text-blue" />}
    </button>
  );
}

function Field({
  label,
  counter,
  children,
}: {
  label: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[12px] font-medium text-text-primary">{label}</div>
        {counter && (
          <div className="text-[11px] text-text-tertiary font-mono">{counter}</div>
        )}
      </div>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "shrink-0 w-10 h-6 rounded-full transition-colors relative",
        checked ? "bg-blue" : "bg-subtle",
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
          checked ? "left-[18px]" : "left-0.5",
        )}
      />
    </button>
  );
}

// Keep unused import silenced
void Link;
