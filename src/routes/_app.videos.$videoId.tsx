import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { mockVideos, mockChannels, type VideoStatus } from "@/mock/data";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/videos/$videoId")({
  head: ({ params }) => ({
    meta: [{ title: `Video ${params.videoId} — TubePilot` }],
  }),
  component: VideoDetailPage,
  notFoundComponent: () => (
    <div className="text-[13px] text-text-secondary">Video not found.</div>
  ),
});

const statusPill: Record<VideoStatus, { label: string; className: string }> = {
  published: { label: "Live", className: "bg-green/15 text-green border border-green/30" },
  pending_review: { label: "Pending", className: "bg-amber/15 text-amber border border-amber/30" },
  publishing: { label: "Uploading", className: "bg-blue/15 text-blue border border-blue/30" },
  draft: { label: "Draft", className: "bg-raised text-text-secondary border border-subtle" },
  failed: { label: "Failed", className: "bg-red/15 text-red border border-red/30" },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " UTC";

function VideoDetailPage() {
  const { videoId } = useParams({ from: "/_app/videos/$videoId" });
  const navigate = useNavigate();
  const v = mockVideos.find((x) => x.id === videoId);

  const [title, setTitle] = useState(v?.title ?? "");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [category, setCategory] = useState("People & Blogs");
  const [privacy, setPrivacy] = useState("Public");

  if (!v) {
    return (
      <div className="text-[13px] text-text-secondary">
        <Link to="/videos" className="text-blue hover:underline">← Back to videos</Link>
        <div className="mt-2">Video not found.</div>
      </div>
    );
  }

  const ch = mockChannels.find((c) => c.id === v.channelId);
  const meta = statusPill[v.status];

  return (
    <div className="space-y-6">
      <Link
        to="/videos"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Videos
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold tracking-tight truncate">
            {v.title}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-[13px]">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                meta.className,
              )}
            >
              {meta.label}
            </span>
            <span className="text-text-secondary">{ch?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-subtle hover:bg-hover px-3.5 h-9 text-[13px] font-medium">
            <ExternalLink className="w-4 h-4" />
            Open on YouTube
          </button>
          <button
            onClick={() => navigate({ to: "/videos" })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red/40 text-red hover:bg-red/10 px-3.5 h-9 text-[13px] font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Editor card */}
      <div className="rounded-xl border border-subtle bg-surface p-5 space-y-4">
        <Field label="Title" counter={`${title.length}/100`}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            className="w-full h-10 rounded-lg bg-raised border border-subtle px-3 text-[13px]"
          />
        </Field>
        <Field label="Description" counter={`${description.length}/5000`}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
            rows={5}
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
                  onClick={() => setTags((p) => p.filter((x) => x !== t))}
                  className="text-text-tertiary hover:text-red"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  e.preventDefault();
                  setTags((p) => [...p, tagInput.trim()]);
                  setTagInput("");
                }
              }}
              placeholder="Press Enter to add..."
              className="flex-1 min-w-[120px] bg-transparent text-[13px] outline-none py-1"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              {["People & Blogs", "Music", "Education", "Entertainment", "Gaming"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Privacy">
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="w-full h-10 rounded-lg bg-raised border border-subtle px-3 text-[13px]"
            >
              {["Public", "Unlisted", "Private"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>

        <button className="inline-flex items-center gap-1.5 rounded-full bg-blue text-white hover:opacity-90 px-4 h-10 text-[13px] font-medium">
          Save changes
        </button>
      </div>

      {/* Status history */}
      <div className="rounded-xl border border-subtle bg-surface p-5">
        <div className="text-[15px] font-semibold">Status history</div>
        <ul className="mt-3 space-y-3">
          <HistoryItem color="bg-blue" title="Created" time={fmt(v.createdAt)} />
          <HistoryItem
            color="bg-blue"
            title="Uploading"
            time={`Upload started · ${fmt(v.createdAt)}`}
          />
          {v.status === "published" && v.publishedAt && (
            <HistoryItem
              color="bg-green"
              title="Published"
              time={fmt(v.publishedAt)}
            />
          )}
          {v.status === "failed" && (
            <HistoryItem color="bg-red" title="Failed" time={v.error ?? ""} />
          )}
        </ul>
      </div>
    </div>
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
        {counter && <div className="text-[11px] text-text-tertiary font-mono">{counter}</div>}
      </div>
      {children}
    </label>
  );
}

function HistoryItem({
  color,
  title,
  time,
}: {
  color: string;
  title: string;
  time: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", color)} />
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[12px] text-text-secondary">{time}</div>
      </div>
    </li>
  );
}
