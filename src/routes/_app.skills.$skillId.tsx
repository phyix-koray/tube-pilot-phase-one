import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  History,
  Sparkles,
  Upload,
  RotateCcw,
  Send,
  Plus,
  Bot,
  User as UserIcon,
  ChevronDown,
  Play,
} from "lucide-react";
import { mockSkills } from "@/mock/data";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/skills/$skillId")({
  loader: ({ params }) => {
    const skill = mockSkills.find((s) => s.id === params.skillId);
    if (!skill) throw notFound();
    return { skill };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.skill.name} — Skills` : "Skill" }],
  }),
  component: SkillEditor,
  notFoundComponent: () => (
    <div className="p-8 text-text-secondary">Skill not found.</div>
  ),
});

// ---------------------------------------------------------------------------
// Model catalog — user can pick which AI drives the skill authoring chat.
// The platform key powers these; the user can also bring their own.
// ---------------------------------------------------------------------------
type ModelId =
  | "gpt-5"
  | "gpt-4o"
  | "gpt-4.1-mini"
  | "claude-opus-4"
  | "claude-sonnet-4"
  | "claude-haiku-4";

const MODELS: Array<{
  id: ModelId;
  label: string;
  vendor: "OpenAI" | "Anthropic";
  tag: string;
}> = [
  { id: "gpt-5", label: "GPT-5", vendor: "OpenAI", tag: "Flagship" },
  { id: "gpt-4o", label: "GPT-4o", vendor: "OpenAI", tag: "Fast" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", vendor: "OpenAI", tag: "Cheap" },
  { id: "claude-opus-4", label: "Claude Opus 4", vendor: "Anthropic", tag: "Deep" },
  { id: "claude-sonnet-4", label: "Claude Sonnet 4", vendor: "Anthropic", tag: "Balanced" },
  { id: "claude-haiku-4", label: "Claude Haiku 4", vendor: "Anthropic", tag: "Fast" },
];

// ---------------------------------------------------------------------------
// Version + chat types
// ---------------------------------------------------------------------------
type Version = {
  id: string;
  label: string;
  savedAt: string;
  by: "You" | ModelId;
  note?: string;
  content: string;
};

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: ModelId;
  patch?: string; // optional preview of what the AI proposes to apply
};

function nowIso() {
  return new Date().toISOString();
}
function relTime(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

// Mock "AI" response — pretends to edit the skill file.
function mockAssistantReply(
  prompt: string,
  currentText: string,
  model: ModelId,
): { reply: string; nextText: string } {
  const p = prompt.trim().toLowerCase();
  let nextText = currentText;
  let reply = "";
  const asClaude = model.startsWith("claude");

  if (p.includes("shorter") || p.includes("kısalt")) {
    nextText = currentText.split("\n").slice(0, 6).join("\n");
    reply = asClaude
      ? "Trimmed the file to its 6 strongest lines and removed the redundant tail."
      : "Shortened — kept the top 6 lines, dropped the rest.";
  } else if (p.includes("bullet") || p.includes("madde")) {
    nextText = currentText
      .split(/\n+/)
      .map((l) => (l.trim().startsWith("-") ? l : `- ${l.trim()}`))
      .filter((l) => l !== "- ")
      .join("\n");
    reply = "Rewrote as a bullet list — one instruction per line.";
  } else if (p.includes("add") || p.includes("ekle")) {
    const addition =
      "\n\n# Style\n- Prefer concrete nouns over abstractions.\n- Never open with a question.";
    nextText = currentText + addition;
    reply = asClaude
      ? "Added a **Style** section with two rules matching the tone you asked for."
      : "Appended a Style block with two concrete rules.";
  } else if (p.includes("clean") || p.includes("temizle")) {
    nextText = currentText.replace(/\n{3,}/g, "\n\n").trim();
    reply = "Normalized whitespace and stripped trailing blank lines.";
  } else {
    reply = asClaude
      ? `Here's how I'd revise this — I kept the intent but tightened the phrasing and made the structure more explicit. Want me to apply it?`
      : `I can revise this. Here's the plan:\n\n1. Keep the current intent\n2. Tighten phrasing\n3. Make the structure explicit\n\nSay "apply" and I'll rewrite the file.`;
  }
  return { reply, nextText };
}

function SkillEditor() {
  const { skill } = Route.useLoaderData();

  // ---- Editor state ----
  const [text, setText] = useState(skill.instructions);
  const [savedText, setSavedText] = useState(skill.instructions);
  const dirty = text !== savedText;

  // ---- Versions ----
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "v-initial",
      label: "Initial",
      savedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      by: "You",
      note: "Imported from library",
      content: skill.instructions,
    },
  ]);
  const [activeVersion, setActiveVersion] = useState("v-initial");

  const saveVersion = (label: string, by: Version["by"], note?: string) => {
    const v: Version = {
      id: `v-${Date.now()}`,
      label,
      savedAt: nowIso(),
      by,
      note,
      content: text,
    };
    setVersions((prev) => [v, ...prev]);
    setActiveVersion(v.id);
    setSavedText(text);
  };

  const restoreVersion = (v: Version) => {
    setText(v.content);
    setActiveVersion(v.id);
  };

  // ---- Model + memory ----
  const [model, setModel] = useState<ModelId>("claude-sonnet-4");
  const [modelOpen, setModelOpen] = useState(false);
  const [memory, setMemory] = useState<string[]>([
    "Skill category: " + skill.category,
    'User prefers "concrete nouns over abstractions".',
    "Skill is used in: " + skill.usedIn,
  ]);

  // ---- Chat ----
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "m-init",
      role: "assistant",
      content: `Hi — I'm your skill authoring copilot. I can rewrite, tighten, add sections, or generate a fresh skill file from scratch. I have memory of past sessions on this skill and you can switch models any time.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: 9e6, behavior: "smooth" });
  }, [messages, sending]);

  const send = () => {
    const q = input.trim();
    if (!q || sending) return;
    setSending(true);
    const userMsg: ChatMsg = { id: `m-${Date.now()}`, role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Record a tiny memory item
    setMemory((prev) => [...prev, `User asked: "${q.slice(0, 60)}"`].slice(-8));
    setTimeout(() => {
      const { reply, nextText } = mockAssistantReply(q, text, model);
      const asstMsg: ChatMsg = {
        id: `m-${Date.now() + 1}`,
        role: "assistant",
        content: reply,
        model,
        patch: nextText !== text ? nextText : undefined,
      };
      setMessages((prev) => [...prev, asstMsg]);
      setSending(false);
    }, 850);
  };

  const applyPatch = (patch: string) => {
    setText(patch);
  };

  // ---- File upload ----
  const fileRef = useRef<HTMLInputElement | null>(null);
  const onUpload = async (f: File) => {
    const t = await f.text();
    setText(t);
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        role: "assistant",
        content: `Loaded **${f.name}** (${Math.round(f.size / 1024)} KB). You can now ask me to edit it — try "make it shorter" or "convert to bullets".`,
        model,
      },
    ]);
    setMemory((prev) => [...prev, `Uploaded file: ${f.name}`]);
  };

  // ---- Test panel ----
  const [sample, setSample] = useState("Topic: The Vajont Dam disaster 1963");
  const [output, setOutput] = useState(
    "S001: Picture a concrete wall standing at the edge of an alpine valley just before dawn.\n\nS002: The engineers called it impossible. And then they built it anyway.",
  );
  const [testOpen, setTestOpen] = useState(false);

  const modelMeta = MODELS.find((m) => m.id === model)!;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/skills"
            className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" /> Skills
          </Link>
          <span className="text-text-tertiary">/</span>
          <div className="text-[15px] font-semibold truncate">{skill.name}</div>
          {dirty && (
            <span className="text-[11px] text-amber font-medium">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".md,.txt,.mdc,.skill"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-surface hover:bg-hover px-3 h-9 text-[13px] font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
          <button
            onClick={() => setTestOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-surface hover:bg-hover px-3 h-9 text-[13px] font-medium"
          >
            <Play className="w-3.5 h-3.5" />
            Test
          </button>
          <button
            disabled={!dirty}
            onClick={() => saveVersion(`v${versions.length + 1}`, "You")}
            className="rounded-md bg-blue hover:bg-blue/90 disabled:opacity-40 text-white px-3.5 h-9 text-[13px] font-medium"
          >
            Save version
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* -------- Versions -------- */}
        <aside className="col-span-12 lg:col-span-3 rounded-xl bg-surface border border-subtle overflow-hidden">
          <div className="px-3 h-10 flex items-center justify-between border-b border-subtle">
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-tertiary font-medium">
              <History className="w-3.5 h-3.5" />
              Versions
            </div>
            <span className="text-[11px] text-text-tertiary">
              {versions.length}
            </span>
          </div>
          <div className="max-h-[520px] overflow-auto divide-y divide-subtle">
            {versions.map((v) => {
              const active = v.id === activeVersion;
              const byModel = MODELS.find((m) => m.id === v.by);
              return (
                <button
                  key={v.id}
                  onClick={() => restoreVersion(v)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 hover:bg-hover transition-colors",
                    active && "bg-hover",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12.5px] font-semibold text-text-primary">
                      {v.label}
                    </div>
                    <div className="text-[10.5px] text-text-tertiary">
                      {relTime(v.savedAt)}
                    </div>
                  </div>
                  <div className="mt-0.5 text-[11px] text-text-secondary flex items-center gap-1.5">
                    {v.by === "You" ? (
                      <UserIcon className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                    {v.by === "You" ? "You" : byModel?.label ?? v.by}
                  </div>
                  {v.note && (
                    <div className="mt-1 text-[11px] text-text-tertiary line-clamp-2">
                      {v.note}
                    </div>
                  )}
                  {active && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] text-blue">
                      <RotateCcw className="w-3 h-3" /> currently loaded
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t border-subtle">
            <div className="text-[10.5px] uppercase tracking-wide text-text-tertiary font-medium mb-1.5">
              AI memory
            </div>
            <ul className="space-y-1 text-[11.5px] text-text-secondary">
              {memory.slice(-4).map((m, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-text-tertiary">·</span>
                  <span className="line-clamp-2">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* -------- Editor -------- */}
        <section className="col-span-12 lg:col-span-5 rounded-xl bg-surface border border-subtle overflow-hidden flex flex-col">
          <div className="px-3 h-10 flex items-center justify-between border-b border-subtle">
            <div className="text-[11px] uppercase tracking-wide text-text-tertiary font-medium">
              Skill file
            </div>
            <div className="text-[11px] text-text-tertiary font-mono">
              {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 min-h-[440px] w-full bg-base p-3.5 font-mono text-[12.5px] leading-relaxed resize-none outline-none"
          />
          <div className="flex items-center gap-2 px-3 py-2 border-t border-subtle bg-raised/40">
            <select
              defaultValue={skill.category}
              className="h-7 rounded-md bg-surface border border-subtle px-2 text-[12px]"
            >
              {["Music", "Documentary", "Education", "General"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className="h-7 rounded-md bg-surface border border-subtle px-2 text-[12px]">
              <option>Used in: {skill.usedIn}</option>
            </select>
          </div>
        </section>

        {/* -------- AI Chat -------- */}
        <section className="col-span-12 lg:col-span-4 rounded-xl bg-surface border border-subtle overflow-hidden flex flex-col">
          <div className="px-3 h-10 flex items-center justify-between border-b border-subtle relative">
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-tertiary font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              AI editor
            </div>
            <button
              onClick={() => setModelOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-subtle bg-surface hover:bg-hover px-2 h-7 text-[11.5px] font-medium"
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  modelMeta.vendor === "OpenAI" ? "bg-green" : "bg-orange",
                )}
              />
              {modelMeta.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            {modelOpen && (
              <div className="absolute right-3 top-10 z-20 w-64 rounded-lg bg-surface border border-subtle card-shadow py-1">
                {(["OpenAI", "Anthropic"] as const).map((v) => (
                  <div key={v}>
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-text-tertiary">
                      {v}
                    </div>
                    {MODELS.filter((m) => m.vendor === v).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m.id);
                          setModelOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-[12.5px] hover:bg-hover",
                          m.id === model && "bg-hover",
                        )}
                      >
                        <span className="font-medium">{m.label}</span>
                        <span className="text-[10.5px] text-text-tertiary">
                          {m.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
                <div className="border-t border-subtle mt-1 px-3 py-2 text-[10.5px] text-text-tertiary">
                  Powered by the Lovable API key on this workspace.
                </div>
              </div>
            )}
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 overflow-auto p-3 space-y-3 min-h-[380px] max-h-[440px]"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2",
                  m.role === "user" && "flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full shrink-0 flex items-center justify-center",
                    m.role === "user"
                      ? "bg-blue text-white"
                      : "bg-raised text-text-primary",
                  )}
                >
                  {m.role === "user" ? (
                    <UserIcon className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                </div>
                <div className="min-w-0 max-w-[85%]">
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-blue text-white"
                        : "bg-raised text-text-primary",
                    )}
                  >
                    {m.content}
                  </div>
                  {m.patch && (
                    <div className="mt-1.5 rounded-md border border-subtle bg-base p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] uppercase tracking-wide text-text-tertiary font-medium">
                          Proposed rewrite
                        </span>
                        <button
                          onClick={() => {
                            applyPatch(m.patch!);
                            saveVersion(
                              `AI · v${versions.length + 1}`,
                              m.model ?? model,
                              "Applied from chat",
                            );
                          }}
                          className="text-[11px] font-medium text-blue hover:underline"
                        >
                          Apply & save
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-text-secondary max-h-24 overflow-auto whitespace-pre-wrap">
                        {m.patch.slice(0, 400)}
                        {m.patch.length > 400 ? "…" : ""}
                      </pre>
                    </div>
                  )}
                  {m.model && m.role === "assistant" && (
                    <div className="mt-1 text-[10.5px] text-text-tertiary">
                      {MODELS.find((mm) => mm.id === m.model)?.label}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-raised flex items-center justify-center">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-raised text-[12.5px] text-text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-text-tertiary animate-bounce" />
                    <span
                      className="w-1 h-1 rounded-full bg-text-tertiary animate-bounce"
                      style={{ animationDelay: "120ms" }}
                    />
                    <span
                      className="w-1 h-1 rounded-full bg-text-tertiary animate-bounce"
                      style={{ animationDelay: "240ms" }}
                    />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-subtle p-2.5 space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {[
                "Make it shorter",
                "Rewrite as bullets",
                "Add a Style section",
                "Clean up whitespace",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-[11px] rounded-full border border-subtle bg-surface hover:bg-hover px-2.5 h-6 text-text-secondary"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder={`Ask ${modelMeta.label} to edit this skill…`}
                className="flex-1 rounded-md bg-raised border border-subtle p-2 text-[12.5px] resize-none outline-none focus:ring-1 focus:ring-blue"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="h-9 w-9 rounded-md bg-blue hover:bg-blue/90 disabled:opacity-40 text-white inline-flex items-center justify-center shrink-0"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* -------- Test drawer -------- */}
      {testOpen && (
        <div className="rounded-xl bg-surface border border-subtle p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-text-tertiary font-medium">
              Test this skill
            </div>
            <button
              onClick={() => setTestOpen(false)}
              className="text-[11px] text-text-secondary hover:text-text-primary"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-text-secondary">
                Sample input
              </label>
              <textarea
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                rows={4}
                className="w-full mt-1 rounded-md bg-base border border-subtle p-2.5 text-[13px] resize-none"
              />
              <button
                onClick={() =>
                  setOutput(
                    (o) =>
                      `S001: ${sample.replace(/^Topic:\s*/, "")} unfolds against a horizon slowly bleeding red.\n\n${o}`,
                  )
                }
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-blue hover:bg-blue/90 text-white px-3 h-8 text-[13px] font-medium"
              >
                <Play className="w-3.5 h-3.5" />
                Run test
              </button>
            </div>
            <div>
              <label className="text-[11px] text-text-secondary">Output</label>
              <div className="mt-1 rounded-md bg-base border border-subtle p-2.5 font-mono text-[12px] whitespace-pre-wrap min-h-32 text-text-secondary">
                {output}
              </div>
              <div className="mt-2 text-[11px] text-text-tertiary inline-flex items-center gap-1">
                <Plus className="w-3 h-3" />
                10 credits per test
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
