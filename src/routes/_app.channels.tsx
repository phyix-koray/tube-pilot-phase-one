import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RefreshCcw, Trash2, ChevronRight, X, CheckCircle2, Loader2 } from "lucide-react";
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
  const [connectOpen, setConnectOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Channels</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Connect the YouTube channels your agents publish to.
          </p>
        </div>
        <button
          onClick={() => setConnectOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 px-3.5 h-9 text-[13px] font-medium"
        >
          <Plus className="w-4 h-4" />
          Connect Channel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockChannels.map((c) => (
          <ChannelCard key={c.id} c={c} />
        ))}
      </div>

      {connectOpen && (
        <GoogleAuthModal
          onClose={() => setConnectOpen(false)}
          onDone={(name) => {
            setConnectOpen(false);
            setToast(`Connected ${name} via Google.`);
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

/* -------------------------------------------------------------
 * Mock Google / YouTube OAuth flow
 * ----------------------------------------------------------- */

const GOOGLE_ACCOUNTS = [
  { email: "koray@example.com", name: "Koray Bakirkure", channel: "Coastal Sounds" },
  { email: "koray.creator@gmail.com", name: "Koray B. (Creator)", channel: "New Yolk Eggonomist" },
  { email: "studio@tubepilot.co", name: "TubePilot Studio", channel: "Stickman United" },
];

function GoogleAuthModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (channelName: string) => void;
}) {
  const [phase, setPhase] = useState<"pick" | "consent" | "loading">("pick");
  const [selected, setSelected] = useState<(typeof GOOGLE_ACCOUNTS)[number] | null>(null);

  const goConsent = (acc: (typeof GOOGLE_ACCOUNTS)[number]) => {
    setSelected(acc);
    setPhase("consent");
  };

  const allow = () => {
    if (!selected) return;
    setPhase("loading");
    setTimeout(() => onDone(selected.channel), 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white text-[#202124] card-shadow overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-black/5 flex items-center justify-center text-[#5f6368] z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google header */}
        <div className="px-6 pt-6 pb-3">
          <GoogleLogo />
          <div className="mt-4 text-[22px] leading-tight text-[#202124]">
            {phase === "pick" && "Choose an account"}
            {phase === "consent" && "TubePilot wants access to your Google Account"}
            {phase === "loading" && "Connecting…"}
          </div>
          <div className="mt-1 text-[13px] text-[#5f6368]">
            {phase === "pick" && "to continue to TubePilot"}
            {phase === "consent" && selected?.email}
          </div>
        </div>

        {phase === "pick" && (
          <div className="px-2 pb-3">
            {GOOGLE_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => goConsent(a)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-black/5 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[13px] font-medium">
                  {a.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium truncate">{a.name}</div>
                  <div className="text-[12px] text-[#5f6368] truncate">{a.email}</div>
                </div>
              </button>
            ))}
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-black/5 text-left text-[14px] text-[#1a73e8]">
              <div className="w-8 h-8 rounded-full border border-[#dadce0] flex items-center justify-center text-[#5f6368]">+</div>
              Use another account
            </button>
          </div>
        )}

        {phase === "consent" && selected && (
          <div className="px-6 pb-6">
            <div className="text-[13px] text-[#5f6368] mb-3">
              This will allow TubePilot to:
            </div>
            <ul className="space-y-2 text-[13px] text-[#202124]">
              <ConsentRow text="See, edit, and permanently delete your YouTube videos, ratings, comments and captions." />
              <ConsentRow text="Manage your YouTube account (upload, edit metadata, thumbnails, schedule publishing)." />
              <ConsentRow text="See your primary Google Account email address." />
            </ul>
            <div className="mt-5 text-[12px] text-[#5f6368] leading-relaxed">
              Make sure you trust TubePilot. You can remove this access anytime in your Google Account settings.
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPhase("pick")}
                className="text-[13px] text-[#1a73e8] hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={allow}
                className="rounded-md bg-[#1a73e8] hover:bg-[#1765cc] text-white px-5 h-9 text-[13px] font-medium"
              >
                Allow
              </button>
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div className="px-6 pb-8 flex items-center gap-3 text-[13px] text-[#5f6368]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Fetching your YouTube channels…
          </div>
        )}
      </div>
    </div>
  );
}

function ConsentRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <div className="w-4 h-4 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center text-[10px] shrink-0 mt-0.5">
        ✓
      </div>
      <span>{text}</span>
    </li>
  );
}

function GoogleLogo() {
  return (
    <svg width="74" height="24" viewBox="0 0 74 24" aria-label="Google">
      <text x="0" y="19" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="500">
        <tspan fill="#4285F4">G</tspan>
        <tspan fill="#EA4335">o</tspan>
        <tspan fill="#FBBC05">o</tspan>
        <tspan fill="#4285F4">g</tspan>
        <tspan fill="#34A853">l</tspan>
        <tspan fill="#EA4335">e</tspan>
      </text>
    </svg>
  );
}
