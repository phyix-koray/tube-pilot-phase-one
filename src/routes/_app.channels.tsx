import { createFileRoute } from "@tanstack/react-router";
import { Plus, RefreshCcw, Trash2, ChevronRight } from "lucide-react";
import { mockChannels, type Channel } from "@/mock/data";

export const Route = createFileRoute("/_app/channels")({
  head: () => ({
    meta: [
      { title: "Channels — TubePilot" },
      {
        name: "description",
        content: "Connect the YouTube channels you want to manage.",
      },
    ],
  }),
  component: ChannelsPage,
});

function ChannelsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Channels</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Connect the YouTube channels your agents publish to.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium">
          <Plus className="w-4 h-4" />
          Connect Channel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockChannels.map((c) => (
          <ChannelCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

function ChannelCard({ c }: { c: Channel }) {
  const accent = c.color;
  return (
    <div
      className="rounded-xl bg-surface overflow-hidden card-shadow transition-transform hover:-translate-y-0.5"
      style={{ border: `2px solid ${accent}` }}
    >
      <div className="flex items-center gap-3 px-5 pt-5">
        <div
          className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-xl"
          style={{ backgroundColor: accent }}
        >
          {c.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-text-primary truncate">
            {c.name}
          </div>
          <div className="text-[11px] text-text-tertiary">
            {c.subscribers.toLocaleString()} subscriber
            {c.subscribers === 1 ? "" : "s"} · Connected{" "}
            {new Date(c.connectedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="px-5 mt-3">
        <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1.5">
          Niche / topic
        </div>
        <input
          defaultValue={c.niche}
          placeholder="Add channel niche…"
          className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
        />
        <div className="text-[11px] text-text-tertiary mt-2">
          Used in: {c.usedIn ?? "—"}
        </div>
      </div>

      <div className="mt-4 border-t border-subtle bg-raised/40 flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3 h-8 text-[13px] font-medium">
            <RefreshCcw className="w-3.5 h-3.5" />
            Sync
          </button>
          <button className="inline-flex items-center gap-1 rounded-md hover:bg-hover px-2 h-8 text-[13px] text-red">
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
        <button className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary px-2 h-8">
          Settings <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
