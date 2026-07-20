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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
          {filtered.map((w) => {
            const isVideoAgent =
              w.id === "ai-video-generator" ||
              w.id === "stock-video-generator" ||
              w.id === "mix-video-generator";
            return (
              <AgentCard
                key={w.id}
                w={w}
                onUse={() => {
                  if (isVideoAgent && typeof window !== "undefined") {
                    window.open(`/run/${w.id}`, "_blank", "noopener");
                  } else {
                    setRunTarget(w);
                  }
                }}
              />
            );
          })}
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

// Broad timezone catalog with GMT offset labels
const TIMEZONES: Array<{ value: string; label: string }> = [
  { value: "Pacific/Midway|-11:00", label: "GMT-11:00 · Midway" },
  { value: "Pacific/Honolulu|-10:00", label: "GMT-10:00 · Honolulu" },
  { value: "America/Anchorage|-09:00", label: "GMT-09:00 · Anchorage" },
  { value: "America/Los_Angeles|-08:00", label: "GMT-08:00 · Los Angeles" },
  { value: "America/Denver|-07:00", label: "GMT-07:00 · Denver" },
  { value: "America/Chicago|-06:00", label: "GMT-06:00 · Chicago / Mexico City" },
  { value: "America/New_York|-05:00", label: "GMT-05:00 · New York / Toronto" },
  { value: "America/Halifax|-04:00", label: "GMT-04:00 · Halifax" },
  { value: "America/Sao_Paulo|-03:00", label: "GMT-03:00 · São Paulo / Buenos Aires" },
  { value: "Atlantic/Azores|-01:00", label: "GMT-01:00 · Azores" },
  { value: "UTC|+00:00", label: "GMT+00:00 · UTC / London" },
  { value: "Europe/Paris|+01:00", label: "GMT+01:00 · Paris / Berlin / Madrid" },
  { value: "Europe/Athens|+02:00", label: "GMT+02:00 · Athens / Cairo" },
  { value: "Europe/Istanbul|+03:00", label: "GMT+03:00 · Istanbul / Moscow / Riyadh" },
  { value: "Asia/Dubai|+04:00", label: "GMT+04:00 · Dubai" },
  { value: "Asia/Karachi|+05:00", label: "GMT+05:00 · Karachi" },
  { value: "Asia/Kolkata|+05:30", label: "GMT+05:30 · India" },
  { value: "Asia/Dhaka|+06:00", label: "GMT+06:00 · Dhaka" },
  { value: "Asia/Bangkok|+07:00", label: "GMT+07:00 · Bangkok / Jakarta" },
  { value: "Asia/Shanghai|+08:00", label: "GMT+08:00 · Shanghai / Singapore" },
  { value: "Asia/Tokyo|+09:00", label: "GMT+09:00 · Tokyo / Seoul" },
  { value: "Australia/Sydney|+10:00", label: "GMT+10:00 · Sydney" },
  { value: "Pacific/Auckland|+12:00", label: "GMT+12:00 · Auckland" },
];

function tzLabel(v: string) {
  return TIMEZONES.find((t) => t.value === v)?.label ?? v;
}
function tzOffset(v: string) {
  const off = v.split("|")[1];
  return off ? `GMT${off}` : v;
}

// Draft an image style guideline from the current theme text (mock "AI")
function draftImageGuideline(theme: string): string {
  const t = (theme || "").toLowerCase();
  const bits: string[] = [];
  bits.push("All generated visuals will share one consistent world:");
  if (t.includes("hanok") || t.includes("seoul") || t.includes("korea"))
    bits.push("• Interior of a softly lit Korean hanok — paper screens, dark timber beams, warm lantern glow.");
  else if (t.includes("lofi") || t.includes("lo-fi") || t.includes("study"))
    bits.push("• A cozy studio room with a rain-streaked window, warm desk lamp, plants and vinyl.");
  else if (t.includes("jazz") || t.includes("lounge"))
    bits.push("• The view from inside a luxury apartment — floor-to-ceiling windows over a city skyline.");
  else
    bits.push("• The view from inside a luxury home — tall windows framing a wide landscape outside.");
  bits.push("• Every scene shot at golden hour / sunset — long amber light, deep shadows.");
  bits.push("• Cinematic 16:9, photorealistic, shallow depth of field, film grain, no text, no people facing camera.");
  bits.push("• Consistent color palette: warm amber, dusty rose, deep teal shadows.");
  return bits.join("\n");
}

function draftVideoGuideline(theme: string): string {
  const t = (theme || "").toLowerCase();
  const bits: string[] = [];
  bits.push("Looping background video (seamless 6–10s loop, no cuts):");
  if (t.includes("hanok") || t.includes("seoul"))
    bits.push("• Slow push-in through paper screens, rain drifting past the window, lantern flicker.");
  else if (t.includes("lofi") || t.includes("study"))
    bits.push("• Rain streaks sliding down the window, warm lamp bloom, subtle steam from a mug.");
  else
    bits.push("• Gentle parallax across the skyline outside, drifting clouds, warm sunlight shifting on the wall.");
  bits.push("• Ultra-slow motion, near-static — motion barely perceptible, meant to sit behind audio.");
  bits.push("• Same color palette and lighting as the thumbnail image — must feel like the same world.");
  bits.push("• No hard cuts, no text, no on-screen characters, no camera shake.");
  return bits.join("\n");
}


// ---------------------------------------------------------------------------
// Viral topic finder (mock) — mirrors viral_finder.py output shape
// ---------------------------------------------------------------------------

type ViralTopic = {
  id: string;
  title: string;
  channel: string;
  views: number;
  subs: number;
  ratio: number;
  velocity: number;
  score: number;
  publishedDaysAgo: number;
};

// Deterministic-ish mock viral topics per genre. In real backend this comes
// from YouTube Data API + Claude subtopic expansion (see viral_finder.py).
function mockViralTopics(genre: string, seenTitles: string[]): ViralTopic[] {
  const g = genre.trim().toLowerCase() || "general";
  const seedByGenre: Record<string, string[]> = {
    finance: [
      "The $2 Trillion Debt Nobody Talks About",
      "Why the Yen Just Broke Its 34-Year Low",
      "How BlackRock Quietly Owns Your City",
      "The Silent Bank Run of 2026",
      "The Return of the Gold Standard?",
      "Why Warren Buffett Just Sold Apple",
      "Inside the Coming Commercial Real Estate Crash",
      "The Country Paying Off Debt With Bitcoin",
    ],
    history: [
      "The Roman Emperor Who Faked His Own Death",
      "The Assassination That Almost Erased America",
      "The Library That Held Human Knowledge — And Burned",
      "The Ottoman Spy Who Redrew Europe",
      "The Forgotten War That Made China",
      "The Ship That Vanished With 600 Souls",
    ],
    tech: [
      "OpenAI's Silent Pivot Nobody Noticed",
      "The GPU Shortage Is a Lie",
      "Why Every Startup Is Suddenly Copying Cursor",
      "The One-Person Billion-Dollar Company",
      "The Real Reason Apple Killed the Car",
    ],
    general: [
      "The Story Behind the Photo That Broke the Internet",
      "The Town That Voted to Delete Itself",
      "The Man Who Predicted 2026",
      "The Netflix Show Netflix Doesn't Want You to Find",
      "The Silent Collapse of the Middle Class",
      "The Country Paying People to Move There",
    ],
  };
  const pool =
    seedByGenre[
      Object.keys(seedByGenre).find((k) => g.includes(k)) ?? "general"
    ] ?? seedByGenre.general;
  const filtered = pool.filter((t) => !seenTitles.includes(t));
  const rng = (seed: number) => {
    let x = seed;
    return () => {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
  };
  const r = rng(g.length * 7 + filtered.length * 13 + 1);
  return filtered.slice(0, 6).map((title, i) => {
    const subs = Math.floor(50_000 + r() * 3_000_000);
    const views = Math.floor(subs * (0.6 + r() * 4.2));
    const days = Math.max(1, Math.floor(1 + r() * 18));
    const ratio = +(views / subs).toFixed(2);
    const velocity = Math.floor(views / days);
    const score = +(ratio * 10 + velocity / 1000).toFixed(1);
    return {
      id: `vt-${i}-${g}`,
      title,
      channel: ["@newswire", "@byteline", "@thearchive", "@moneyframe", "@storyloop"][i % 5],
      views,
      subs,
      ratio,
      velocity,
      score,
      publishedDaysAgo: days,
    };
  });
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Generate similar/iterated variations of a viral title (mock "AI"). Mirrors
// the "iterate from this" pattern where the model expands one hook into
// sibling angles the user can pick from.
function mockIterateTitles(sourceTitle: string, genre: string): string[] {
  const g = genre.trim().toLowerCase();
  const src = sourceTitle;
  // Genre-agnostic transforms: swap protagonist, invert framing, add stakes.
  const swaps: Record<string, string[]> = {
    OpenAI: ["Anthropic", "Google DeepMind", "Meta AI"],
    Apple: ["Google", "Microsoft", "Samsung"],
    Cursor: ["Windsurf", "Zed", "Copilot Workspace"],
    BlackRock: ["Vanguard", "Bridgewater", "State Street"],
    Yen: ["Yuan", "Lira", "Peso"],
    Ottoman: ["Byzantine", "Mongol", "Habsburg"],
    Roman: ["Persian", "Chinese", "Mayan"],
    Netflix: ["Disney+", "HBO", "Prime Video"],
  };
  const found = Object.keys(swaps).find((k) => src.includes(k));
  const variants: string[] = [];
  if (found) {
    swaps[found].forEach((alt) => variants.push(src.replace(found, alt)));
  }
  // Add framing variants regardless
  variants.push(
    src.startsWith("Why")
      ? src.replace(/^Why/, "The Real Reason")
      : `Why ${src}`,
  );
  variants.push(
    src.includes("Nobody")
      ? src.replace("Nobody", "Everyone")
      : `${src} — And Why It Matters Now`,
  );
  if (g.includes("finance")) variants.push(`The Hidden Cost Behind ${src}`);
  else if (g.includes("history")) variants.push(`The Untold Story of ${src}`);
  else if (g.includes("tech")) variants.push(`What ${src} Actually Means for 2027`);
  else variants.push(`Inside ${src}`);
  // Dedupe & keep first 4
  return Array.from(new Set(variants.filter((v) => v && v !== src))).slice(0, 4);
}

// Mirrors the "AI ANALİZ VE İÇERİK FİKİRLERİ" block from viral_finder.py output.
export function mockCommonPatterns(genre: string): string[] {
  const g = genre.trim().toLowerCase();
  if (g.includes("finance") || g.includes("money") || g.includes("altın") || g.includes("ekonomi")) {
    return [
      "Curiosity / puzzle-style hooks that pull the viewer into a 'guess or spot the trick' interaction (hidden asset, doubling-money question).",
      "Timely, practical finance explainers (gold prices, credit vs. loan comparisons, breaking bank news) that ride real-time demand.",
      "'Hidden money / savings' how-to guides on obscure topics (deposit refunds, stealth taxes, poverty premiums).",
      "Real-case storytelling that extracts a broader financial lesson (invoice error saga, YouTuber income teardown).",
      "Big-number / mathematical face-offs used as attention hooks (10M lump sum vs. doubling penny).",
    ];
  }
  if (g.includes("history")) {
    return [
      "Forgotten-figure biographies framed as 'the person history erased'.",
      "Turning-point retellings that reframe a familiar event through a single overlooked decision.",
      "Artifact / document deep-dives where the object anchors the entire narrative.",
      "Empire-collapse explainers that map ancient patterns onto modern anxieties.",
      "Myth-busting takes that debunk widely-repeated historical 'facts'.",
    ];
  }
  if (g.includes("tech") || g.includes("ai")) {
    return [
      "'Quiet pivot' narratives about a big-tech move nobody noticed yet.",
      "Contrarian debunks of the current hype cycle (shortage myths, overrated tools).",
      "One-person / solo-founder success dissections with concrete revenue numbers.",
      "Under-the-hood breakdowns of a product's real moat vs. its marketing.",
      "Predictive 'next 12 months' framings tied to a single leading indicator.",
    ];
  }
  return [
    "Puzzle / 'can you spot it' hooks that promise interactive payoff.",
    "Real-time / newsy explainers riding today's most searched question.",
    "Hidden-knowledge how-tos on things everyone should know but doesn't.",
    "Single-case narrative arcs that generalise into a bigger lesson.",
    "High-contrast comparisons using extreme numbers or scenarios.",
  ];
}

// Mirrors the "Önerilen 5 özgün video fikri" block from viral_finder.py output.
export function mockSuggestedIdeas(
  genre: string,
): { title: string; pitch: string }[] {
  const g = genre.trim().toLowerCase();
  if (g.includes("finance") || g.includes("money") || g.includes("altın") || g.includes("ekonomi")) {
    return [
      { title: "Bu Faturadaki Gizli Hatayı Bulabilir misin? 🧾", pitch: "Interactive puzzle video inviting viewers to spot a hidden arithmetic error on a real utility bill — payoff explains the exact scam pattern behind it." },
      { title: "Evdeki Kullanılmayan Eşyalardan Ayda 5.000 TL Çıkarma Yöntemleri", pitch: "Practical teardown of five under-used household items and the exact resale / rental channels that turn them into recurring monthly income." },
      { title: "10 TL ile Başlayan Milyoner Deneyi — 30 Günde Ne Oldu?", pitch: "Daily-log style challenge that doubles a tiny starting stake through legal micro-arbitrage and reveals where the math actually breaks." },
      { title: "Bankanızın Size Söylemediği 7 Gizli Ücret", pitch: "Contract-line deep dive with real screenshots, showing which fees are negotiable and the exact phrasing that gets them refunded." },
      { title: "1 Milyon Aboneli Finans YouTuber'ı Aslında Ne Kadar Kazanıyor?", pitch: "Reverse-engineered income teardown using public CPM data — separates sponsor income, AdSense, and course sales into a single realistic P&L." },
    ];
  }
  if (g.includes("history")) {
    return [
      { title: "The Emperor Who Faked His Own Death — And What He Did Next", pitch: "Investigates the primary sources behind the disappearance and reconstructs a plausible second life from tax records." },
      { title: "The Library That Held Human Knowledge — And the One Book That Survived", pitch: "Traces a single manuscript from Alexandria to a modern shelf, using it as a lens on what civilisations lose in a single fire." },
      { title: "The 5-Minute Decision That Redrew Europe", pitch: "Frames a single Ottoman envoy's dispatch as the pivot point most European histories skip over entirely." },
      { title: "History's Most Successful Con Artist You've Never Heard Of", pitch: "Reconstructs the paper trail of a 19th-century impostor who fooled three governments and left almost no photographs." },
      { title: "The Ship That Vanished With 600 Souls — Solved 200 Years Later", pitch: "Uses recent sonar data to lay a modern investigation on top of the contemporary newspaper record, ending with a defensible theory." },
    ];
  }
  if (g.includes("tech") || g.includes("ai")) {
    return [
      { title: "OpenAI's Silent Pivot Nobody Noticed", pitch: "Reads job postings, patent filings, and API changelogs to reconstruct the product direction the keynote never mentioned." },
      { title: "The One-Person Billion-Dollar Company Playbook", pitch: "Breaks down the exact stack, pricing, and distribution loop behind a solo founder crossing $10M ARR in 14 months." },
      { title: "Why Every YC Startup Is Suddenly Copying Cursor", pitch: "Maps the last two batches to show the UX primitives Cursor turned into table stakes — and the one nobody is copying yet." },
      { title: "The GPU Shortage Is a Lie — Here's the Real Bottleneck", pitch: "Walks through supply data to show where capacity is actually stuck, and which downstream companies quietly benefit." },
      { title: "The Real Reason Apple Killed the Car (It Isn't What They Said)", pitch: "Cross-references SEC filings, hiring freezes, and Vision Pro roadmap leaks to reconstruct the internal trade-off." },
    ];
  }
  return [
    { title: "The Story Behind the Photo That Broke the Internet", pitch: "Traces a viral image back to its source and unpacks who actually profited from its spread." },
    { title: "The Town That Voted to Delete Itself", pitch: "Ground-level report from a community that legally dissolved — what triggered it and what came next." },
    { title: "The Man Who Predicted 2026 — In 1998", pitch: "Reads a forgotten futurist essay against today's headlines and scores which calls landed." },
    { title: "The Netflix Show Netflix Doesn't Want You to Find", pitch: "Investigates why a well-reviewed series was quietly removed from search — and how to still watch it legally." },
    { title: "The Country Paying People to Move There", pitch: "On-the-ground breakdown of a real relocation programme, including the fine print nobody mentions." },
  ];
}

// Generate NEW similar topics (not just title variations) — full ViralTopic
// entries with fresh mock metrics so the user gets real "more like this"
// choices, not just reworded hooks of the same underlying idea.
function mockMoreLikeThis(src: ViralTopic, genre: string): ViralTopic[] {
  const titles = mockIterateTitles(src.title, genre);
  const rng = (seed: number) => {
    let x = seed;
    return () => {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
  };
  const r = rng(src.title.length * 3 + genre.length + 11);
  const channels = ["@echoloop", "@sidebrief", "@primaryfeed", "@thecutline", "@fieldnote"];
  return titles.slice(0, 3).map((title, i) => {
    const subs = Math.floor(80_000 + r() * 2_500_000);
    const views = Math.floor(subs * (0.8 + r() * 3.5));
    const days = Math.max(1, Math.floor(1 + r() * 14));
    const ratio = +(views / subs).toFixed(2);
    const velocity = Math.floor(views / days);
    const score = +(ratio * 10 + velocity / 1000).toFixed(1);
    return {
      id: `${src.id}-mlt-${i}`,
      title,
      channel: channels[(i + src.title.length) % channels.length],
      views,
      subs,
      ratio,
      velocity,
      score,
      publishedDaysAgo: days,
    };
  });
}

// ---------------------------------------------------------------------------
// Recurring content plan (daily / weekly) — editable spreadsheet the agent
// auto-fills so the user can review a full run schedule in one place.
// ---------------------------------------------------------------------------
export type PlanRow = {
  id: string;
  date: string;
  title: string;
  topic: string;
  length: string;
  format: string;
  artStyle: string;
  webSearch: boolean;
  deepResearch: boolean;
};

const FORMATS = ["Documentary", "Explainer", "Story", "Listicle", "Case study", "Debunk", "Timeline"];
const ART_STYLES = ["Stickman", "Cinematic photoreal", "Vintage archival", "Minimal 2D motion", "Editorial noir", "Warm sunset realism", "Neo-noir illustration"];
const LENGTHS = ["1–5 min", "6–10 min", "11–20 min", "21–40 min", "41–60 min", "60–90 min"];

export function mockPlanRows(
  genre: string,
  cadence: "daily" | "weekly",
  count = 7,
): PlanRow[] {
  const ideas = mockSuggestedIdeas(genre);
  const viral = mockViralTopics(genre, []);
  const pool = [
    ...ideas.map((i) => ({ title: i.title, topic: i.pitch })),
    ...viral.map((v) => ({
      title: v.title,
      topic: `Deep-dive angle on "${v.title}" — targets the same over-performing hook with an original narrative.`,
    })),
  ];
  const today = new Date();
  return Array.from({ length: count }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (cadence === "weekly" ? (i + 1) * 7 : i + 1));
    const p = pool[i % pool.length];
    return {
      id: `row-${i}`,
      date: d.toISOString().slice(0, 10),
      title: p.title,
      topic: p.topic,
      length: LENGTHS[i % LENGTHS.length],
      format: FORMATS[i % FORMATS.length],
      artStyle: "Stickman",
      webSearch: true,
      deepResearch: i % 2 === 0,
    };
  });
}



export function RunAgentWizard({
  agent,
  onClose,
  onDone,
  variant = "modal",
}: {
  agent: Workflow;
  onClose?: () => void;
  onDone: (message: string) => void;
  variant?: "modal" | "page";
}) {
  const navigate = useNavigate();
  const accent = agent.accent ?? "var(--tp-subtle)";
  const isMusic = agent.id === "music-composer";
  const isVideo =
    agent.id === "ai-video-generator" ||
    agent.id === "stock-video-generator" ||
    agent.id === "mix-video-generator";

  const suggestedChannel =
    mockChannels.find((c) => c.usedIn?.includes(agent.name)) ?? mockChannels[0];

  const [channelId, setChannelId] = useState(suggestedChannel.id);

  // Generic
  const [prompt, setPrompt] = useState(
    isMusic
      ? "slow smooth jazz, saxophone, cozy ambient lounge"
      : agent.id === "stock-video-generator"
        ? "Top 5 underrated moments of the last World Cup."
        : "The Dam That Never Cracked — a 3-minute short doc about the Houston dam.",
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
  const [videoGuideline, setVideoGuideline] = useState<string>("");
  const [guidelineTouched, setGuidelineTouched] = useState(false);
  const [videoGuidelineTouched, setVideoGuidelineTouched] = useState(false);

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

  // Video agent (viral topic finder) state
  const [genre, setGenre] = useState(
    agent.id === "stock-video-generator" ? "history" : "tech",
  );
  const [searching, setSearching] = useState(false);
  const [topics, setTopics] = useState<ViralTopic[]>([]);
  const [pickedTopic, setPickedTopic] = useState<string | null>(null);
  const [seenTitles, setSeenTitles] = useState<string[]>([]);
  const [iterations, setIterations] = useState<Record<string, ViralTopic[]>>({});
  const [iteratingId, setIteratingId] = useState<string | null>(null);
  const [pickedIdea, setPickedIdea] = useState<number | null>(null);

  // Recurring video plan (daily/weekly) — auto-generated editable table
  const [plan, setPlan] = useState<PlanRow[]>([]);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [planFullscreen, setPlanFullscreen] = useState(false);
  const planAutoGenRef = useRef(false);
  const DEFAULT_COL_WIDTHS = [36, 44, 128, 240, 360, 108, 148, 140, 64, 64, 44];
  const [colWidths, setColWidths] = useState<number[]>(DEFAULT_COL_WIDTHS);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [ctxMenu, setCtxMenu] = useState<
    | {
        x: number;
        y: number;
        kind: "row" | "cell";
        rowIdx: number;
        cellKey?: keyof PlanRow;
      }
    | null
  >(null);
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [ctxMenu]);
  const startColResize = (idx: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[idx];
    const onMove = (ev: PointerEvent) => {
      const w = Math.max(32, startW + ev.clientX - startX);
      setColWidths((prev) => prev.map((c, i) => (i === idx ? w : c)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const buildRow = (i: number, cadence: "daily" | "weekly"): PlanRow => {
    const rows = mockPlanRows(genre || "editorial", cadence, i + 3);
    const r = rows[(i + Math.floor(Math.random() * rows.length)) % rows.length];
    return { ...r, id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  };
  const regenerateRow = (idx: number) => {
    setPlan((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...buildRow(idx, mode === "weekly" ? "weekly" : "daily"), date: r.date, id: r.id }
          : r,
      ),
    );
  };
  const insertRow = (idx: number, where: "above" | "below") => {
    const cadence = mode === "weekly" ? "weekly" : "daily";
    const nr = buildRow(idx, cadence);
    setPlan((prev) => {
      const at = where === "above" ? idx : idx + 1;
      return [...prev.slice(0, at), nr, ...prev.slice(at)];
    });
  };
  const duplicateRow = (idx: number) => {
    setPlan((prev) => {
      const src = prev[idx];
      if (!src) return prev;
      const clone = { ...src, id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      return [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
    });
  };
  const clearRow = (idx: number) => {
    setPlan((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, title: "", topic: "", webSearch: false, deepResearch: false }
          : r,
      ),
    );
  };
  const deleteRow = (idx: number) =>
    setPlan((prev) => prev.filter((_, i) => i !== idx));
  const moveRow = (from: number, to: number) => {
    if (from === to || to < 0) return;
    setPlan((prev) => {
      if (to >= prev.length) return prev;
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };
  const clearCell = (idx: number, key: keyof PlanRow) => {
    setPlan((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const empty: string | boolean =
          typeof r[key] === "boolean" ? false : "";
        return { ...r, [key]: empty } as PlanRow;
      }),
    );
  };


  const [videoTheme, setVideoTheme] = useState("");

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
    : isVideo
      ? isRecurring
        ? [
            { key: "channel", title: "Channel" },
            { key: "schedule", title: "Schedule" },
            { key: "theme", title: "Theme" },
            { key: "plan", title: "Content plan" },
            { key: "review", title: "Review" },
          ]
        : [
            { key: "channel", title: "Channel" },
            { key: "schedule", title: "Schedule" },
            { key: "topic", title: "Topic" },
            { key: "length", title: "Video length" },
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

  const runViralSearch = () => {
    setSearching(true);
    setPickedTopic(null);
    setTopics([]);
    setIterations({});
    setTimeout(() => {
      setTopics(mockViralTopics(genre, seenTitles));
      setSearching(false);
    }, 5000);
  };

  const iterateFrom = (t: ViralTopic) => {
    setIteratingId(t.id);
    setTimeout(() => {
      const news = mockMoreLikeThis(t, genre);
      setIterations((prev) => ({ ...prev, [t.id]: news }));
      setTopics((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        return [...prev, ...news.filter((n) => !existing.has(n.id))];
      });
      setIteratingId(null);
    }, 3000);
  };

  const pickedTopicObj = topics.find((t) => t.id === pickedTopic) ?? null;

  // Auto-draft guidelines whenever the effective theme changes,
  // unless the user has already edited them manually.
  useEffect(() => {
    if (!guidelineTouched) setImageGuideline(draftImageGuideline(effectiveTheme));
    if (!videoGuidelineTouched) setVideoGuideline(draftVideoGuideline(effectiveTheme));
  }, [effectiveTheme, guidelineTouched, videoGuidelineTouched]);

  // Auto-generate the recurring content plan the first time the user
  // reaches the "plan" step, so the spreadsheet is never empty.
  const currentKey = RUN_STEPS[Math.min(step, RUN_STEPS.length - 1)].key;
  useEffect(() => {
    if (currentKey !== "plan" || !isVideo) return;
    if (planAutoGenRef.current) return;
    planAutoGenRef.current = true;
    setPlanGenerating(true);
    const t = setTimeout(() => {
      setPlan(
        mockPlanRows(
          genre || "editorial",
          mode === "weekly" ? "weekly" : "daily",
          mode === "weekly" ? 6 : 7,
        ),
      );
      setPlanGenerating(false);
    }, 1800);
    return () => clearTimeout(t);
  }, [currentKey, isVideo, genre, mode]);



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
    <div
      className={
        variant === "page"
          ? "w-full"
          : "fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      }
    >
      {variant === "modal" && (
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        />
      )}
      <div
        className={
          variant === "page"
            ? "relative w-full bg-transparent flex flex-col"
            : "relative w-full max-w-2xl rounded-2xl bg-surface card-shadow overflow-hidden max-h-[92vh] flex flex-col"
        }
        style={variant === "page" ? undefined : { border: `2px solid ${accent}` }}
      >
        {variant === "modal" && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-hover flex items-center justify-center text-text-secondary z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

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
                One-shot run — the AI has suggested a keyword set for Suno based on your channel's mood.
              </div>
              <Field label="AI-Suggested Keyword Set">
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => setTags(SUGGESTED_TAGS)}
                    className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
                  >
                    <Sparkles className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[12px] font-mono resize-none"
                />
                <div className="text-[11px] text-text-tertiary mt-1.5">
                  Passed straight to Suno as the tag string for every generated song.
                </div>
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
          ) : stepKey === "theme" && isVideo ? (
            <div className="space-y-4">
              <div className="text-[12px] text-text-tertiary">
                Recurring run — describe the channel's theme once. The agent
                will use it to auto-fill a full {mode === "weekly" ? "weekly" : "daily"} content plan on
                the next step.
              </div>
              <Field label="Niche / genre keyword">
                <input
                  value={genre}
                  onChange={(e) => {
                    setGenre(e.target.value);
                    setPlan([]);
                  }}
                  placeholder="e.g. finance, history, tech, geopolitics"
                  className="w-full h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
                />
              </Field>
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
                        placeholder="@byteline  or  https://youtube.com/@byteline"
                        className="flex-1 h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!channelRef.trim()) return;
                          setAnalyzing(true);
                          setTimeout(() => {
                            setAnalyzed(
                              `Long-form ${genre || "editorial"} deep-dives inspired by "${channelRef.trim()}" — investigative pacing, archival visuals, contrarian angles.`,
                            );
                            setAnalyzing(false);
                          }, 900);
                        }}
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
                    value={videoTheme}
                    onChange={(e) => setVideoTheme(e.target.value)}
                    placeholder="e.g. Investigative deep-dives on hidden financial infrastructure — contrarian, data-heavy, 8–12 min per video."
                    className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[13px] resize-none"
                  />
                </Field>
              )}
            </div>
          ) : stepKey === "plan" && isVideo ? (
            <div
              className={cn(
                "space-y-4",
                planFullscreen &&
                  "fixed inset-0 z-50 bg-base p-6 overflow-auto flex flex-col",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-[12px] text-text-tertiary max-w-xl">
                  The agent has drafted a full {mode === "weekly" ? "6-week" : "7-day"} content plan
                  from your theme. Every field is editable — tweak titles,
                  topics, formats, or toggles before you launch. You can also
                  regenerate or add rows.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanGenerating(true);
                      setTimeout(() => {
                        const n = plan.length || (mode === "weekly" ? 6 : 7);
                        const fresh = mockPlanRows(
                          genre,
                          mode === "weekly" ? "weekly" : "daily",
                          n,
                        );
                        setPlan((prev) =>
                          fresh.map((f, i) => ({
                            ...f,
                            id: prev[i]?.id ?? f.id,
                            date: prev[i]?.date ?? f.date,
                          })),
                        );
                        setPlanGenerating(false);
                      }, 2200);
                    }}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-primary rounded-md border border-subtle bg-surface hover:bg-hover px-2.5 h-8"
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: accent as string }} />
                    Regenerate all
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const emptyIdx = plan
                        .map((r, i) => (!r.title.trim() || !r.topic.trim() ? i : -1))
                        .filter((i) => i >= 0);
                      if (emptyIdx.length === 0) return;
                      setPlanGenerating(true);
                      setTimeout(() => {
                        const fresh = mockPlanRows(
                          genre,
                          mode === "weekly" ? "weekly" : "daily",
                          plan.length,
                        );
                        setPlan((prev) =>
                          prev.map((r, i) =>
                            emptyIdx.includes(i)
                              ? { ...fresh[i], id: r.id, date: r.date }
                              : r,
                          ),
                        );
                        setPlanGenerating(false);
                      }, 1600);
                    }}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-primary rounded-md border border-subtle bg-surface hover:bg-hover px-2.5 h-8"
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: accent as string }} />
                    Regenerate empty
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const n = plan.length;
                      const d = new Date();
                      d.setDate(
                        d.getDate() + (mode === "weekly" ? (n + 1) * 7 : n + 1),
                      );
                      setPlan((prev) => [
                        ...prev,
                        {
                          id: `row-${Date.now()}`,
                          date: d.toISOString().slice(0, 10),
                          title: "",
                          topic: "",
                          length: LENGTHS[0],
                          format: FORMATS[0],
                          artStyle: ART_STYLES[0],
                          webSearch: true,
                          deepResearch: false,
                        },
                      ]);
                    }}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-primary rounded-md border border-subtle bg-surface hover:bg-hover px-2.5 h-8"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add row
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanFullscreen((v) => !v)}
                    title={planFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-primary rounded-md border border-subtle bg-surface hover:bg-hover px-2.5 h-8"
                  >
                    {planFullscreen ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        Exit
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        Fullscreen
                      </>
                    )}
                  </button>
                </div>
              </div>

              {planGenerating || plan.length === 0 ? (
                <ThinkingBlock accent={accent} kind="plan" />
              ) : (
                <div
                  className={cn(
                    "overflow-auto rounded-lg border border-subtle bg-raised/30",
                    planFullscreen ? "flex-1" : "max-h-[560px]",
                  )}
                >
                  <table
                    className="text-[12px] border-separate border-spacing-0 table-fixed"
                    style={{ width: colWidths.reduce((a, b) => a + b, 0) }}
                  >
                    <colgroup>
                      {colWidths.map((w, i) => (
                        <col key={i} style={{ width: w }} />
                      ))}
                    </colgroup>
                    <thead className="bg-raised text-text-tertiary text-[10.5px] uppercase tracking-wide sticky top-0 z-10">
                      <tr>
                        {[
                          { label: "", align: "center" },
                          { label: "#", align: "left" },
                          { label: "Date", align: "left" },
                          { label: "Video title", align: "left" },
                          { label: "Topic (detailed)", align: "left" },
                          { label: "Length", align: "left" },
                          { label: "Format", align: "left" },
                          { label: "Art style", align: "left" },
                          { label: "Web", align: "center" },
                          { label: "Deep", align: "center" },
                          { label: "", align: "left" },
                        ].map((h, i) => (
                          <th
                            key={i}
                            className={cn(
                              "relative font-medium px-2 py-2 border-b border-subtle select-none",
                              i > 0 && "border-l",
                              h.align === "center" ? "text-center" : "text-left",
                            )}
                          >
                            {h.label}
                            {i < colWidths.length - 1 && (
                              <span
                                onPointerDown={(e) => startColResize(i, e)}
                                className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-text-tertiary/40 active:bg-text-tertiary/60"
                                style={{ transform: "translateX(50%)" }}
                              />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {plan.map((row, idx) => {
                        const cell = "border-b border-l border-subtle px-0 py-0 align-top";
                        const input =
                          "w-full h-11 bg-transparent focus:bg-base focus:ring-1 focus:ring-inset px-2 text-[12px] outline-none border-0";
                        const openCellMenu = (
                          e: React.MouseEvent,
                          key: keyof PlanRow,
                        ) => {
                          e.preventDefault();
                          setCtxMenu({
                            x: e.clientX,
                            y: e.clientY,
                            kind: "cell",
                            rowIdx: idx,
                            cellKey: key,
                          });
                        };
                        const isDropTarget = dropIdx === idx && dragIdx !== idx;
                        return (
                          <tr
                            key={row.id}
                            className={cn(
                              "group hover:bg-hover/30",
                              isDropTarget && "outline outline-1 -outline-offset-1",
                              dragIdx === idx && "opacity-50",
                            )}
                            style={
                              isDropTarget
                                ? { outlineColor: accent as string }
                                : undefined
                            }
                            onDragOver={(e) => {
                              if (dragIdx === null) return;
                              e.preventDefault();
                              setDropIdx(idx);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragIdx !== null && dragIdx !== idx) {
                                moveRow(dragIdx, idx);
                              }
                              setDragIdx(null);
                              setDropIdx(null);
                            }}
                          >
                            {/* Regen icon column */}
                            <td className="border-b border-subtle px-0 py-0 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => regenerateRow(idx)}
                                title="Regenerate this row with AI"
                                className="w-7 h-7 rounded-md opacity-80 group-hover:opacity-100 hover:bg-hover inline-flex items-center justify-center transition-opacity"
                                style={{ color: accent as string }}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </td>
                            {/* # / drag handle */}
                            <td
                              draggable
                              onDragStart={() => setDragIdx(idx)}
                              onDragEnd={() => {
                                setDragIdx(null);
                                setDropIdx(null);
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setCtxMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  kind: "row",
                                  rowIdx: idx,
                                });
                              }}
                              title="Drag to reorder — right-click for row actions"
                              className="border-b border-l border-subtle px-2 py-0 text-[11px] text-text-tertiary font-mono tabular-nums cursor-grab active:cursor-grabbing select-none h-11 align-middle"
                            >
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td
                              className={cell}
                              onContextMenu={(e) => openCellMenu(e, "date")}
                            >
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) =>
                                  setPlan((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, date: e.target.value } : r,
                                    ),
                                  )
                                }
                                className={cn(input, "font-mono tabular-nums")}
                                style={{ ["--tw-ring-color" as string]: accent }}
                              />
                            </td>
                            <td
                              className={cell}
                              onContextMenu={(e) => openCellMenu(e, "title")}
                            >
                              <textarea
                                rows={1}
                                value={row.title}
                                onChange={(e) =>
                                  setPlan((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, title: e.target.value } : r,
                                    ),
                                  )
                                }
                                onFocus={(e) => {
                                  e.currentTarget.rows = 3;
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.rows = 1;
                                  e.currentTarget.scrollTop = 0;
                                }}
                                className="w-full h-11 focus:h-auto bg-transparent focus:bg-base focus:ring-1 focus:ring-inset px-2 py-2.5 text-[12px] font-medium leading-snug resize-none outline-none border-0 overflow-hidden focus:overflow-auto transition-[height]"
                                style={{ ["--tw-ring-color" as string]: accent }}
                                placeholder="Video title…"
                              />
                            </td>

                            <td
                              className={cell}
                              onContextMenu={(e) => openCellMenu(e, "topic")}
                            >
                              <textarea
                                rows={1}
                                value={row.topic}
                                onChange={(e) =>
                                  setPlan((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, topic: e.target.value } : r,
                                    ),
                                  )
                                }
                                onFocus={(e) => {
                                  e.currentTarget.rows = 3;
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.rows = 1;
                                  e.currentTarget.scrollTop = 0;
                                }}
                                className="w-full h-11 focus:h-auto bg-transparent focus:bg-base focus:ring-1 focus:ring-inset px-2 py-2.5 text-[12px] leading-snug resize-none outline-none border-0 overflow-hidden focus:overflow-auto transition-[height]"
                                style={{ ["--tw-ring-color" as string]: accent }}
                                placeholder="Detailed topic description…"
                              />
                            </td>

                            <td
                              className={cell}
                              onContextMenu={(e) => openCellMenu(e, "length")}
                            >
                              <select
                                value={row.length}
                                onChange={(e) =>
                                  setPlan((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, length: e.target.value } : r,
                                    ),
                                  )
                                }
                                className={input}
                                style={{ ["--tw-ring-color" as string]: accent }}
                              >
                                {LENGTHS.map((l) => (
                                  <option key={l} value={l}>{l}</option>
                                ))}
                              </select>
                            </td>
                            <td
                              className={cell}
                              onContextMenu={(e) => openCellMenu(e, "format")}
                            >
                              <select
                                value={row.format}
                                onChange={(e) =>
                                  setPlan((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, format: e.target.value } : r,
                                    ),
                                  )
                                }
                                className={input}
                                style={{ ["--tw-ring-color" as string]: accent }}
                              >
                                {FORMATS.map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </td>
                            <td
                              className={cell}
                              onContextMenu={(e) => openCellMenu(e, "artStyle")}
                            >
                              <select
                                value={row.artStyle}
                                onChange={(e) =>
                                  setPlan((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, artStyle: e.target.value } : r,
                                    ),
                                  )
                                }
                                className={input}
                                style={{ ["--tw-ring-color" as string]: accent }}
                              >
                                {ART_STYLES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td
                              className={cn(cell, "text-center")}
                              onContextMenu={(e) => openCellMenu(e, "webSearch")}
                            >
                              <div className="h-11 flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={row.webSearch}
                                  onChange={(e) =>
                                    setPlan((prev) =>
                                      prev.map((r, i) =>
                                        i === idx ? { ...r, webSearch: e.target.checked } : r,
                                      ),
                                    )
                                  }
                                  style={{ accentColor: accent }}
                                />
                              </div>
                            </td>
                            <td
                              className={cn(cell, "text-center")}
                              onContextMenu={(e) => openCellMenu(e, "deepResearch")}
                            >
                              <div className="h-11 flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={row.deepResearch}
                                  onChange={(e) =>
                                    setPlan((prev) =>
                                      prev.map((r, i) =>
                                        i === idx ? { ...r, deepResearch: e.target.checked } : r,
                                      ),
                                    )
                                  }
                                  style={{ accentColor: accent }}
                                />
                              </div>
                            </td>
                            <td className={cn(cell, "text-center")}>
                              <div className="h-11 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => deleteRow(idx)}
                                  className="w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-hover text-text-tertiary hover:text-text-primary inline-flex items-center justify-center"
                                  aria-label="Remove row"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {ctxMenu && (
                <div
                  className="fixed z-50 min-w-[200px] rounded-md border border-subtle bg-surface shadow-lg py-1 text-[12px]"
                  style={{ left: ctxMenu.x, top: ctxMenu.y }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {ctxMenu.kind === "row" ? (
                    <PlanContextMenu
                      items={[
                        { label: "Regenerate row", icon: Sparkles, onClick: () => regenerateRow(ctxMenu.rowIdx) },
                        { label: "Insert row above", icon: Plus, onClick: () => insertRow(ctxMenu.rowIdx, "above") },
                        { label: "Insert row below", icon: Plus, onClick: () => insertRow(ctxMenu.rowIdx, "below") },
                        { label: "Duplicate row", onClick: () => duplicateRow(ctxMenu.rowIdx) },
                        { label: "Move up", onClick: () => moveRow(ctxMenu.rowIdx, ctxMenu.rowIdx - 1) },
                        { label: "Move down", onClick: () => moveRow(ctxMenu.rowIdx, ctxMenu.rowIdx + 1) },
                        { divider: true },
                        { label: "Clear row", onClick: () => clearRow(ctxMenu.rowIdx) },
                        { label: "Delete row", icon: X, onClick: () => deleteRow(ctxMenu.rowIdx), danger: true },
                      ]}
                      onClose={() => setCtxMenu(null)}
                    />
                  ) : (
                    <PlanContextMenu
                      items={[
                        {
                          label: "Copy",
                          onClick: () => {
                            const r = plan[ctxMenu.rowIdx];
                            const v = ctxMenu.cellKey ? r?.[ctxMenu.cellKey] : "";
                            if (v != null) navigator.clipboard?.writeText(String(v));
                          },
                        },
                        {
                          label: "Paste",
                          onClick: async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (ctxMenu.cellKey) {
                                setPlan((prev) =>
                                  prev.map((r, i) =>
                                    i === ctxMenu.rowIdx && ctxMenu.cellKey
                                      ? ({ ...r, [ctxMenu.cellKey]: text } as PlanRow)
                                      : r,
                                  ),
                                );
                              }
                            } catch {}
                          },
                        },
                        {
                          label: "Clear cell",
                          onClick: () =>
                            ctxMenu.cellKey && clearCell(ctxMenu.rowIdx, ctxMenu.cellKey),
                        },
                        { divider: true },
                        { label: "Regenerate row", icon: Sparkles, onClick: () => regenerateRow(ctxMenu.rowIdx) },
                        { label: "Insert row above", icon: Plus, onClick: () => insertRow(ctxMenu.rowIdx, "above") },
                        { label: "Insert row below", icon: Plus, onClick: () => insertRow(ctxMenu.rowIdx, "below") },
                        { divider: true },
                        { label: "Delete row", icon: X, onClick: () => deleteRow(ctxMenu.rowIdx), danger: true },
                      ]}
                      onClose={() => setCtxMenu(null)}
                    />
                  )}
                </div>
              )}
            </div>
          ) : stepKey === "topic" && isVideo ? (
            <div className="space-y-5">
              <div className="text-[12px] text-text-tertiary">
                One-shot run — enter your niche and pick the topic the agent
                should build this video around. You can select either a viral
                result, one of its variants, or an original idea. Only one
                topic wins per run.
              </div>

              <Field label="Niche / genre">
                <div className="flex gap-2">
                  <input
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. finance, history, tech, geopolitics"
                    className="flex-1 h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={runViralSearch}
                    disabled={!genre.trim() || searching}
                    className="inline-flex items-center gap-1.5 rounded-md bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 disabled:opacity-60 px-3 h-9 text-[13px] font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {searching ? "Searching…" : topics.length > 0 ? "Search again" : "Find topics"}
                  </button>
                </div>
              </Field>

              {searching && <ThinkingBlock accent={accent} kind="viral" />}

              {!searching && topics.length === 0 && (
                <div className="rounded-md bg-raised/40 border border-dashed border-subtle p-4 text-center text-[12px] text-text-tertiary">
                  Enter a niche and click <b>Find topics</b>. The agent will
                  scan YouTube for over-performing videos, then draft original
                  angles from what it finds — all on this page.
                </div>
              )}

              {!searching && topics.filter((t) => !t.id.includes("-mlt-") && !t.id.startsWith("idea-")).length > 0 && (
                <>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-2">
                      Top viral results
                    </div>
                    <div className="space-y-2">
                      {topics
                        .filter((t) => !t.id.includes("-mlt-") && !t.id.startsWith("idea-"))
                        .map((t) => {
                          const active = pickedTopic === t.id;
                          const iters = iterations[t.id] ?? [];
                          const isIterating = iteratingId === t.id;
                          return (
                            <div key={t.id} className="space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setPickedTopic(active ? null : t.id);
                                  setPickedIdea(null);
                                }}
                                className={cn(
                                  "w-full text-left rounded-lg p-3",
                                  active ? "bg-raised" : "bg-raised/40 hover:bg-raised",
                                )}
                                style={
                                  active
                                    ? { border: `2px solid ${accent}` }
                                    : { border: "1px solid var(--tp-subtle)" }
                                }
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-[13px] font-medium truncate">
                                      {t.title}
                                    </div>
                                    <div className="text-[11px] text-text-tertiary mt-0.5">
                                      {t.channel} · {t.publishedDaysAgo}d ago
                                    </div>
                                  </div>
                                  <div
                                    className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                                    style={{ backgroundColor: accent, color: "#0a0a0b" }}
                                  >
                                    {t.score}
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-[11px] text-text-tertiary flex-wrap">
                                  <span>{formatNum(t.views)} views</span>
                                  <span>{formatNum(t.subs)} subs</span>
                                  <span>ratio {t.ratio}×</span>
                                  <span>{formatNum(t.velocity)}/day</span>
                                </div>
                                <div className="mt-2.5 flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-text-tertiary">
                                    {active ? "Selected as topic" : "Click card to select"}
                                  </span>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isIterating) iterateFrom(t);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.stopPropagation();
                                        if (!isIterating) iterateFrom(t);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md border border-subtle hover:bg-hover px-2 h-7 text-[11px] font-medium cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    {isIterating ? "Finding more…" : iters.length > 0 ? "More again" : "More like this"}
                                  </span>
                                </div>
                              </button>

                              {isIterating && (
                                <div className="ml-4">
                                  <ThinkingBlock accent={accent} kind="similar" />
                                </div>
                              )}

                              {iters.length > 0 && (
                                <div
                                  className="ml-4 space-y-2 border-l-2 pl-3"
                                  style={{ borderColor: accent }}
                                >
                                  <div className="text-[10px] uppercase tracking-wide text-text-tertiary">
                                    New topics like "{t.title}"
                                  </div>
                                  {iters.map((sib) => {
                                    const iactive = pickedTopic === sib.id;
                                    return (
                                      <button
                                        key={sib.id}
                                        type="button"
                                        onClick={() => {
                                          setPickedTopic(iactive ? null : sib.id);
                                          setPickedIdea(null);
                                        }}
                                        className={cn(
                                          "w-full text-left rounded-md p-2.5",
                                          iactive ? "bg-raised" : "bg-raised/40 hover:bg-raised",
                                        )}
                                        style={
                                          iactive
                                            ? { border: `2px solid ${accent}` }
                                            : { border: "1px solid var(--tp-subtle)" }
                                        }
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="text-[12.5px] font-medium">
                                            {sib.title}
                                          </div>
                                          <div
                                            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold"
                                            style={{ backgroundColor: accent, color: "#0a0a0b" }}
                                          >
                                            {sib.score}
                                          </div>
                                        </div>
                                        <div className="mt-1 flex items-center gap-3 text-[10.5px] text-text-tertiary flex-wrap">
                                          <span>{sib.channel}</span>
                                          <span>{formatNum(sib.views)} views</span>
                                          <span>ratio {sib.ratio}×</span>
                                          <span>{formatNum(sib.velocity)}/day</span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-subtle bg-raised/40 p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-tertiary">
                      <Sparkles className="w-3 h-3" />
                      AI analysis — common patterns in {genre}
                    </div>
                    <ol className="space-y-1.5 text-[12.5px] text-text-secondary list-decimal pl-4">
                      {mockCommonPatterns(genre).map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-2">
                      Top 3 original video ideas
                    </div>
                    <div className="space-y-2">
                      {mockSuggestedIdeas(genre).slice(0, 3).map((idea, i) => {
                        const id = `idea-${i}`;
                        const iactive = pickedTopic === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              if (iactive) {
                                setPickedIdea(null);
                                setPickedTopic(null);
                                return;
                              }
                              const synthetic: ViralTopic = {
                                id,
                                title: idea.title,
                                channel: "AI original idea",
                                views: 0,
                                subs: 0,
                                ratio: 0,
                                velocity: 0,
                                score: 0,
                                publishedDaysAgo: 0,
                              };
                              setTopics((prev) =>
                                prev.find((t) => t.id === id) ? prev : [...prev, synthetic],
                              );
                              setPickedIdea(i);
                              setPickedTopic(id);
                            }}
                            className={cn(
                              "w-full text-left rounded-md p-3",
                              iactive ? "bg-raised" : "bg-surface hover:bg-raised",
                            )}
                            style={
                              iactive
                                ? { border: `2px solid ${accent}` }
                                : { border: "1px solid var(--tp-subtle)" }
                            }
                          >
                            <div className="text-[13px] font-semibold">
                              {i + 1}. {idea.title}
                            </div>
                            <div className="mt-1 text-[12px] text-text-secondary">
                              {idea.pitch}
                            </div>
                            <div className="mt-2 text-[11px] text-text-tertiary">
                              {iactive ? "Selected as topic" : "Click to use this idea"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {pickedTopicObj && (
                    <div
                      className="rounded-md bg-raised p-2.5 text-[12px]"
                      style={{ border: `2px solid ${accent}` }}
                    >
                      <span className="text-text-tertiary text-[10.5px] uppercase tracking-wide">
                        Selected topic ·{" "}
                      </span>
                      <b>{pickedTopicObj.title}</b>
                    </div>
                  )}
                </>
              )}
            </div>



          ) : stepKey === "length" && (isMusic || isVideo) ? (
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
                    subtitle="Same image as thumbnail + static background"
                    onClick={() => setOutputMode("gorsel")}
                  />
                  <ChoiceOption
                    active={outputMode === "gorsel-video"}
                    accent={accent}
                    title="Image + video"
                    subtitle="Image = thumbnail, video loops as background"
                    onClick={() => setOutputMode("gorsel-video")}
                  />
                </div>
              </Field>

              <Field
                label={
                  outputMode === "gorsel"
                    ? "Image style guideline (AI skill)"
                    : "Image (thumbnail) style guideline (AI skill)"
                }
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setImageGuideline(draftImageGuideline(effectiveTheme));
                      setGuidelineTouched(false);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
                  >
                    <Sparkles className="w-3 h-3" />
                    Regenerate from theme
                  </button>
                  {guidelineTouched && (
                    <span className="text-[10px] text-text-tertiary">edited manually</span>
                  )}
                </div>
                <textarea
                  rows={7}
                  value={imageGuideline}
                  onChange={(e) => {
                    setImageGuideline(e.target.value);
                    setGuidelineTouched(true);
                  }}
                  className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[12px] leading-relaxed resize-none"
                />
                <div className="text-[11px] text-text-tertiary mt-1.5">
                  {outputMode === "gorsel"
                    ? "Applied to every generated image. The same image is used as the thumbnail AND as the static background behind the audio."
                    : "Applied only to the thumbnail image. The looping background video uses its own skill below."}
                </div>
              </Field>

              {outputMode === "gorsel-video" && (
                <Field label="Video (background loop) style guideline (AI skill)">
                  <div className="flex items-center gap-2 mb-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoGuideline(draftVideoGuideline(effectiveTheme));
                        setVideoGuidelineTouched(false);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
                    >
                      <Sparkles className="w-3 h-3" />
                      Regenerate from theme
                    </button>
                    {videoGuidelineTouched && (
                      <span className="text-[10px] text-text-tertiary">edited manually</span>
                    )}
                  </div>
                  <textarea
                    rows={7}
                    value={videoGuideline}
                    onChange={(e) => {
                      setVideoGuideline(e.target.value);
                      setVideoGuidelineTouched(true);
                    }}
                    className="w-full rounded-md bg-raised border border-subtle p-2.5 text-[12px] leading-relaxed resize-none"
                  />
                  <div className="text-[11px] text-text-tertiary mt-1.5">
                    Applied to the looping background video only. Keep the same world & palette as the thumbnail — this describes motion, not composition.
                  </div>
                </Field>
              )}

              <div className="text-[11px] text-text-tertiary rounded-md bg-raised/60 border border-subtle p-2.5">
                Renders through YT Music Combiner with Fade In on the first clip.
              </div>
            </div>
          ) : stepKey === "schedule" ? (
            <div className="space-y-4">
              {isMusic || isVideo ? (
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

              {(isRecurring || (!isMusic && !isVideo && when === "later") || ((isMusic || isVideo) && mode === "one-shot" && when === "later")) && (
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
                      {TIMEZONES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
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
                          ? `Daily · every day at ${scheduleAt} (${tzOffset(tz)})`
                          : mode === "weekly"
                            ? `Weekly · every ${weeklyDay} at ${scheduleAt} (${tzOffset(tz)})`
                            : when === "now"
                              ? "One-shot · run immediately"
                              : `One-shot · today ${scheduleAt} (${tzOffset(tz)})`
                      }
                    />
                    <ReviewRow label="Timezone" value={tzLabel(tz)} />
                    {isRecurring ? (
                      <ReviewRow label="Theme" value={effectiveTheme} multiline />
                    ) : (
                      <ReviewRow label="Keywords" value={tags} multiline />
                    )}
                    <ReviewRow label="Video length" value={lengthLabel} />
                    {!isRecurring && (
                      <ReviewRow
                        label="Suno"
                        value={`${songsPerRun} songs × ${mergeRepeats} loops (${totalTracks} tracks) · ${instrumental ? "Instrumental" : "With vocals"}`}
                      />
                    )}
                    <ReviewRow
                      label="Media"
                      value={`${makeThumbnail ? "Thumbnail on" : "Thumbnail off"} · ${outputMode === "gorsel" ? "Image only (same image as thumbnail + background)" : "Image + video (image = thumbnail, video loops as background)"}`}
                    />
                    <ReviewRow
                      label={outputMode === "gorsel" ? "Image skill" : "Thumbnail skill"}
                      value={imageGuideline}
                      multiline
                    />
                    {outputMode === "gorsel-video" && (
                      <ReviewRow label="Video skill" value={videoGuideline} multiline />
                    )}
                    <ReviewRow
                      label="Publish"
                      value={autoUpload ? `Auto-upload · ${visibility}` : "Manual upload"}
                    />

                  </>
                ) : isVideo ? (
                  <>
                    <ReviewRow
                      label="Schedule"
                      value={
                        mode === "daily"
                          ? `Daily · every day at ${scheduleAt} (${tzOffset(tz)})`
                          : mode === "weekly"
                            ? `Weekly · every ${weeklyDay} at ${scheduleAt} (${tzOffset(tz)})`
                            : when === "now"
                              ? "One-shot · run immediately"
                              : `One-shot · today ${scheduleAt} (${tzOffset(tz)})`
                      }
                    />
                    <ReviewRow label="Timezone" value={tzLabel(tz)} />
                    <ReviewRow label="Niche" value={genre || "—"} />
                    {isRecurring ? (
                      <>
                        <ReviewRow
                          label="Theme"
                          value={
                            themeSource === "channel"
                              ? (analyzed ?? `Pending analysis of ${channelRef || "…"}`)
                              : videoTheme || "(manual theme not set)"
                          }
                          multiline
                        />
                        <PlanReviewSummary
                          plan={plan}
                          mode={mode as "daily" | "weekly"}
                          accent={accent}
                        />
                      </>

                    ) : (
                      <ReviewRow
                        label="Topic"
                        value={
                          pickedTopicObj
                            ? `${pickedTopicObj.title}${pickedTopicObj.score ? ` · score ${pickedTopicObj.score} · ${formatNum(pickedTopicObj.views)} views` : ""}`
                            : "No topic picked yet — go back to the Topic step."
                        }
                        multiline
                      />
                    )}
                    {!isRecurring && (
                      <ReviewRow label="Video length" value={lengthLabel} />
                    )}
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
                      : (isMusic || isVideo) && isRecurring
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

function ThinkingBlock({
  accent,
  kind,
}: {
  accent: string;
  kind: "viral" | "similar" | "analysis" | "plan";
}) {
  const stepsByKind: Record<typeof kind, string[]> = {
    viral: [
      "Querying YouTube Data API for the niche…",
      "Filtering for videos published in the last 14 days…",
      "Scoring by view / subscriber ratio and daily velocity…",
      "Ranking the strongest viral hooks…",
    ],
    similar: [
      "Reading the source hook and its metrics…",
      "Searching sibling videos in the same cluster…",
      "Scoring fresh candidates by velocity…",
      "Drafting new topic cards…",
    ],
    analysis: [
      "Clustering titles by hook shape…",
      "Extracting recurring narrative patterns…",
      "Summarising into reusable formats…",
    ],
    plan: [
      "Analysing your channel theme…",
      "Distributing topics across the schedule…",
      "Picking length, format, and art style per row…",
      "Marking web-search and deep-research needs…",
    ],
  };
  const items = stepsByKind[kind];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="rounded-lg bg-raised/60 p-4 space-y-2.5"
      style={{ border: `1px dashed ${accent}` }}
    >
      <div className="flex items-center gap-2 text-[13px] font-medium">
        <span
          className="inline-block w-3.5 h-3.5 rounded-full animate-pulse"
          style={{ backgroundColor: accent }}
        />
        <span className="text-text-primary">Agent thinking…</span>
        <span className="text-text-tertiary text-[11px]">
          {".".repeat((tick % 3) + 1)}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((s, i) => {
          const active = i <= tick % (items.length + 1);
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 text-[12px] transition-opacity",
                active ? "opacity-100" : "opacity-40",
              )}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: active ? accent : "var(--tp-subtle)" }}
              />
              <span className="text-text-secondary">{s}</span>
            </li>
          );
        })}
      </ul>
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

function PlanReviewSummary({
  plan,
  mode,
  accent,
}: {
  plan: PlanRow[];
  mode: "daily" | "weekly";
  accent: string;
}) {
  if (plan.length === 0) {
    return (
      <ReviewRow
        label="Plan"
        value="No plan generated yet — open the Content plan step."
        multiline
      />
    );
  }

  const totalMinutes = plan.reduce((sum, r) => {
    const n = parseInt(r.length, 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remMin = totalMinutes % 60;
  const totalLabel =
    totalHours > 0 ? `${totalHours}h ${remMin}m` : `${totalMinutes}m`;

  const formats = Array.from(new Set(plan.map((r) => r.format))).join(", ");
  const artStyles = Array.from(new Set(plan.map((r) => r.artStyle))).join(", ");
  const webCount = plan.filter((r) => r.webSearch).length;
  const deepCount = plan.filter((r) => r.deepResearch).length;

  const preview = plan.slice(0, 3);

  return (
    <div className="flex gap-3 px-3 py-2.5">
      <div className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-text-tertiary pt-0.5">
        Plan
      </div>
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-secondary">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold text-[color:var(--tp-text-primary)]"
            style={{ background: accent, color: "#0a0a0b" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-black/70"
            />
            {plan.length} {mode === "weekly" ? "weeks" : "days"} scheduled
          </span>
          <span>Total runtime · <span className="text-text-primary">{totalLabel}</span></span>
          <span>Formats · <span className="text-text-primary">{formats}</span></span>
          <span>Art · <span className="text-text-primary">{artStyles}</span></span>
          <span>
            Research ·{" "}
            <span className="text-text-primary">
              {webCount} web · {deepCount} deep
            </span>
          </span>
        </div>
        <div className="overflow-hidden rounded-md border border-subtle">
          <table className="w-full text-[12px]">
            <thead className="bg-raised/60 text-text-tertiary">
              <tr>
                <th className="text-left font-medium px-2 py-1.5 w-8">#</th>
                <th className="text-left font-medium px-2 py-1.5 w-24">Date</th>
                <th className="text-left font-medium px-2 py-1.5">Title</th>
                <th className="text-left font-medium px-2 py-1.5 w-16">Len</th>
                <th className="text-left font-medium px-2 py-1.5 w-20">Fmt</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-subtle">
                  <td className="px-2 py-1.5 text-text-tertiary tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-2 py-1.5 text-text-secondary tabular-nums">
                    {row.date}
                  </td>
                  <td className="px-2 py-1.5 text-text-primary truncate max-w-0">
                    {row.title || <span className="text-text-tertiary">(untitled)</span>}
                  </td>
                  <td className="px-2 py-1.5 text-text-secondary tabular-nums">
                    {row.length}m
                  </td>
                  <td className="px-2 py-1.5 text-text-secondary">
                    {row.format}
                  </td>
                </tr>
              ))}
              {plan.length > preview.length && (
                <tr className="border-t border-subtle">
                  <td
                    colSpan={5}
                    className="px-2 py-1.5 text-text-tertiary text-center"
                  >
                    + {plan.length - preview.length} more{" "}
                    {mode === "weekly" ? "weeks" : "days"} — edit in Content plan step
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type PlanMenuItem =
  | { divider: true }
  | {
      divider?: false;
      label: string;
      icon?: React.ComponentType<{ className?: string }>;
      onClick: () => void;
      danger?: boolean;
    };

function PlanContextMenu({
  items,
  onClose,
}: {
  items: PlanMenuItem[];
  onClose: () => void;
}) {
  return (
    <>
      {items.map((it, i) => {
        if ("divider" in it && it.divider) {
          return <div key={i} className="my-1 h-px bg-subtle" />;
        }
        const item = it as Exclude<PlanMenuItem, { divider: true }>;
        const Icon = item.icon;
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-hover",
              item.danger ? "text-red" : "text-text-primary",
            )}
          >
            {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="w-3.5" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </>
  );
}


