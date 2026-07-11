import { createFileRoute } from "@tanstack/react-router";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { mockChannels } from "@/mock/data";

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Channels</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Connect the YouTube channels you want to manage.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue hover:bg-blue/90 text-white px-3.5 h-9 text-[13px] font-medium">
          <Plus className="w-4 h-4" />
          Connect Channel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockChannels.map((c) => (
          <div
            key={c.id}
            className="rounded-xl bg-surface border border-subtle p-5 card-shadow"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: c.color + "22", color: c.color }}
              >
                {c.emoji}
              </div>
              <div>
                <div className="text-[16px] font-semibold">
                  {c.name} {c.emoji}
                </div>
                <div className="text-[13px] text-text-secondary">
                  {c.subscribers.toLocaleString()} subscriber
                  {c.subscribers === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1.5">
                Niche / topic
              </div>
              <input
                defaultValue={c.niche}
                placeholder="Add channel niche…"
                className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
              />
            </div>

            <div className="mt-4 text-[11px] text-text-tertiary space-y-0.5">
              <div>Connected: {new Date(c.connectedAt).toLocaleDateString()}</div>
              <div>Used in: {c.usedIn ?? "—"}</div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover px-2.5 h-8 text-[13px]">
                <RefreshCcw className="w-3.5 h-3.5" />
                Sync
              </button>
              <button className="inline-flex items-center gap-1 rounded-md bg-raised hover:bg-hover px-2.5 h-8 text-[13px] text-red">
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
