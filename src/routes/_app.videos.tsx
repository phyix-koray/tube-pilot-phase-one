import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Upload, MoreHorizontal, Pencil, Play, X, Check } from "lucide-react";
import {
  mockVideos,
  mockChannels,
  mockWorkflows,
  type VideoStatus,
} from "@/mock/data";
import { formatCountdown, cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/videos")({
  head: () => ({
    meta: [
      { title: "Videos — TubePilot" },
      { name: "description", content: "Every video your workflows produce." },
    ],
  }),
  component: VideosPage,
});

const statusMeta: Record<
  VideoStatus,
  { label: string; className: string; dot: string; showBanner: boolean }
> = {
  pending_review: {
    label: "Pending Review",
    className: "bg-amber text-black",
    dot: "bg-black",
    showBanner: true,
  },
  publishing: {
    label: "Publishing…",
    className: "bg-blue text-white",
    dot: "bg-white pulse-dot",
    showBanner: true,
  },
  published: {
    label: "Published",
    className: "bg-green text-black",
    dot: "bg-black",
    showBanner: false,
  },
  failed: {
    label: "Failed",
    className: "bg-red text-white",
    dot: "bg-white",
    showBanner: true,
  },
  draft: {
    label: "Draft",
    className: "bg-raised text-text-secondary",
    dot: "bg-text-tertiary",
    showBanner: false,
  },
};

function VideosPage() {
  const [channel, setChannel] = useState("all");
  const [workflow, setWorkflow] = useState("all");
  const [status, setStatus] = useState<VideoStatus | "all">("all");

  const filtered = useMemo(
    () =>
      mockVideos.filter(
        (v) =>
          (channel === "all" || v.channelId === channel) &&
          (workflow === "all" || v.workflowId === workflow) &&
          (status === "all" || v.status === status),
      ),
    [channel, workflow, status],
  );

  const pending = mockVideos.filter((v) => v.status === "pending_review");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-[13px]">
          <span className="text-amber">
            {pending.length} video{pending.length > 1 ? "s" : ""} awaiting your
            review before publishing.
          </span>
          <a href="#pending" className="text-amber font-medium hover:underline">
            Review now →
          </a>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Videos</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            All videos produced by your workflows.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-raised hover:bg-hover text-text-primary px-3.5 h-9 text-[13px]">
          <Upload className="w-4 h-4" />
          Upload manually
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          value={channel}
          onChange={setChannel}
          options={[
            ["all", "All channels"],
            ...mockChannels.map((c) => [c.id, `${c.name} ${c.emoji}`] as [string, string]),
          ]}
        />
        <FilterSelect
          value={workflow}
          onChange={setWorkflow}
          options={[
            ["all", "All workflows"],
            ...mockWorkflows.map((w) => [w.id, w.name] as [string, string]),
          ]}
        />
        <FilterSelect
          value={status}
          onChange={(v) => setStatus(v as VideoStatus | "all")}
          options={[
            ["all", "All statuses"],
            ["publishing", "Publishing"],
            ["pending_review", "Pending Review"],
            ["published", "Published"],
            ["failed", "Failed"],
            ["draft", "Draft"],
          ]}
        />
        <FilterSelect
          value="all"
          onChange={() => {}}
          options={[
            ["all", "Date range"],
            ["7d", "Last 7 days"],
            ["30d", "Last 30 days"],
          ]}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-text-secondary">
        <LegendDot color="bg-blue" label="Publishing" />
        <LegendDot color="bg-amber" label="Pending Review" />
        <LegendDot color="bg-green" label="Published" />
        <LegendDot color="bg-red" label="Failed" />
        <LegendDot color="bg-text-tertiary" label="Draft" />
      </div>

      {/* Grid */}
      <div id="pending" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((v) => {
          const ch = mockChannels.find((c) => c.id === v.channelId);
          const wf = mockWorkflows.find((w) => w.id === v.workflowId);
          const meta = statusMeta[v.status];
          return (
            <div
              key={v.id}
              className="rounded-xl overflow-hidden bg-surface border border-subtle card-shadow"
            >
              <div className="relative aspect-video bg-raised">
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {meta.showBanner && (
                  <div
                    className={cn(
                      "absolute bottom-0 inset-x-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide",
                      meta.className,
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                    {v.status === "pending_review" && v.reviewDeadline && (
                      <span className="ml-auto font-mono">
                        {formatCountdown(v.reviewDeadline)}
                      </span>
                    )}
                    {v.status === "failed" && (
                      <span className="ml-auto">See error</span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-[15px] font-semibold line-clamp-2">
                  {v.title}
                </div>
                <div className="text-[13px] text-text-secondary mt-1">
                  {ch?.name} {ch?.emoji} · {wf?.category ?? "—"}
                </div>
                <div className="text-[13px] text-text-tertiary mt-1 font-mono">
                  {new Date(v.createdAt).toLocaleString([], {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {v.views != null && ` · ${v.views} views`}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Link
                    to="/editor/$videoId"
                    params={{ videoId: v.id }}
                    className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover px-2.5 h-8 text-[13px]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <button className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover px-2.5 h-8 text-[13px]">
                    <Play className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  {v.status === "pending_review" && (
                    <button className="inline-flex items-center gap-1 rounded-md bg-green text-black hover:bg-green/90 px-2.5 h-8 text-[13px] font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  <button className="ml-auto inline-flex items-center rounded-md bg-raised hover:bg-hover px-2 h-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          title="No videos match these filters"
          subtitle="Try relaxing the filter selection above."
          onReset={() => {
            setChannel("all");
            setWorkflow("all");
            setStatus("all");
          }}
        />
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", color)} />
      {label}
    </span>
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
      className="h-8 rounded-md bg-raised border border-subtle text-[13px] px-2.5"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function EmptyState({
  title,
  subtitle,
  onReset,
}: {
  title: string;
  subtitle: string;
  onReset: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-subtle p-12 text-center">
      <X className="w-8 h-8 mx-auto text-text-tertiary" />
      <div className="mt-3 text-[15px] font-semibold">{title}</div>
      <div className="text-[13px] text-text-secondary">{subtitle}</div>
      <button
        onClick={onReset}
        className="mt-4 inline-flex rounded-md bg-raised hover:bg-hover px-3 h-8 text-[13px]"
      >
        Reset filters
      </button>
    </div>
  );
}
