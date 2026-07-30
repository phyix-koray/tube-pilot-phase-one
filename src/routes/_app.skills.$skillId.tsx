import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Download,
  Expand,
  FileText,
  MoreHorizontal,
  Paperclip,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  addAttachment,
  appendMessage,
  clearAttachments,
  deleteSkill,
  getSkill,
  renameSkill,
  removeAttachment,
  removeLegacyMockMessages,
  updateSkillFile,
  useSkill,
} from "@/lib/skills-store";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/skills/$skillId")({
  head: () => ({
    meta: [
      { title: "Skill Builder — TubePilot" },
      {
        name: "description",
        content: "Build, preview, copy, and download reusable AI skill documents.",
      },
      { property: "og:title", content: "Skill Builder — TubePilot" },
      {
        property: "og:description",
        content: "Build reusable TubePilot AI skill documents through chat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SkillDetailPage,
});

type EffortLevel = "low" | "medium" | "high" | "xhigh" | "max";

const EFFORT_LABELS: Record<EffortLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "X-High",
  max: "Max",
};

const MODELS = [
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    group: "Anthropic",
    thinkingMode: "adaptive-effort" as const,
    efforts: ["low", "medium", "high", "xhigh", "max"] as EffortLevel[],
    defaultEffort: "high" as EffortLevel,
  },
  {
    id: "claude-opus-5",
    label: "Claude Opus 5",
    group: "Anthropic",
    thinkingMode: "adaptive-effort" as const,
    efforts: ["low", "medium", "high", "xhigh", "max"] as EffortLevel[],
    defaultEffort: "high" as EffortLevel,
  },
  {
    id: "claude-sonnet-4.5",
    label: "Claude Sonnet 4.5",
    group: "Anthropic",
    // Bu model gerçek açık/kapalı thinking toggle'ı destekliyor (Sonnet 5'te bu mümkün değil).
    thinkingMode: "toggle-budget" as const,
    efforts: ["low", "medium", "high"] as EffortLevel[],
    defaultEffort: "medium" as EffortLevel,
  },
  {
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    group: "OpenAI",
    thinkingMode: "adaptive-effort" as const,
    efforts: ["low", "medium", "high", "xhigh", "max"] as EffortLevel[],
    defaultEffort: "medium" as EffortLevel,
  },
  {
    id: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    group: "OpenAI",
    thinkingMode: "adaptive-effort" as const,
    efforts: ["low", "medium", "high", "xhigh", "max"] as EffortLevel[],
    defaultEffort: "medium" as EffortLevel,
  },
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    group: "OpenAI",
    thinkingMode: "adaptive-effort" as const,
    efforts: ["low", "medium", "high"] as EffortLevel[],
    defaultEffort: "medium" as EffortLevel,
  },
  {
    id: "gemini-3.1-pro",
    label: "Gemini 3.1 Pro",
    group: "Google",
    thinkingMode: "adaptive-effort" as const,
    efforts: ["low", "medium", "high"] as EffortLevel[],
    defaultEffort: "high" as EffortLevel,
  },
  {
    id: "gemini-3-flash",
    label: "Gemini 3 Flash",
    group: "Google",
    thinkingMode: "adaptive-effort" as const,
    efforts: ["low", "medium", "high"] as EffortLevel[],
    defaultEffort: "medium" as EffortLevel,
  },
] as const;

type ModelId = (typeof MODELS)[number]["id"];


function SkillDetailPage() {
  const { skillId } = useParams({ from: "/_app/skills/$skillId" });
  const skill = useSkill(skillId);

  const [input, setInput] = useState("");
  const [model, setModel] = useState<ModelId>("claude-sonnet-4.5");
  const [effort, setEffort] = useState<EffortLevel>("medium");
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [effortOpen, setEffortOpen] = useState(false);

  const currentModel = MODELS.find((m) => m.id === model) ?? MODELS[0];

  const selectModel = (id: ModelId) => {
    setModel(id);
    const found = MODELS.find((m) => m.id === id);
    if (found) setEffort(found.defaultEffort);
  };
  const [preview, setPreview] = useState<{ name: string; content: string } | null>(null);
  const [titleEdit, setTitleEdit] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    inputRef.current?.focus();
  }, [skillId]);

  useEffect(() => {
    removeLegacyMockMessages(skillId);
  }, [skillId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [skill?.messages.length]);

  const askSkillAi = async ({
    skillFileOverride,
    attachmentsOverride,
  }: {
    skillFileOverride?: string;
    attachmentsOverride?: NonNullable<ReturnType<typeof getSkill>>["attachments"];
  }) => {
    const current = getSkill(skillId);
    if (!current) return;
    const history = current.messages.map((m) => ({ role: m.role, content: m.content }));

    // Konuşma boyunca herhangi bir mesajla yüklenmiş tüm dosyaları topluyoruz,
    // böylece AI önceki turlarda yüklenen bir dosyayı da hatırlayabiliyor —
    // sadece o anki mesaja eklenmiş attachment'ları değil.
    const attachmentsFromHistory = current.messages.flatMap((m) => m.attachments ?? []);
    const allAttachments = [...attachmentsFromHistory, ...(attachmentsOverride ?? current.attachments ?? [])];
    // Aynı isimde birden fazla kez yüklendiyse en son hâlini tut.
    const dedupedAttachments = Array.from(
      new Map(allAttachments.map((a) => [a.name, a])).values(),
    );

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";
      const res = await fetch(`${BACKEND_URL}/api/chat-skill`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history,
          model,
          effort,
          thinkingEnabled,
          skillName: current.name,
          skillFile: skillFileOverride ?? current.file,
          attachments: dedupedAttachments,
        }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok || data.error) {
        appendMessage(current.id, {
          role: "assistant",
          content: `⚠️ ${data.error ?? "Request failed"}`,
        });
      } else {
        const reply = data.content ?? "(empty response)";
        const nextSkillFile = extractSkillMarkdown(reply);
        const chatText = nextSkillFile.trim()
          ? stripSkillFileFromReply(reply) || "Skill dosyası güncellendi."
          : reply;
        appendMessage(current.id, { role: "assistant", content: chatText });
        if (nextSkillFile.trim()) {
          updateSkillFile(current.id, nextSkillFile);
        }
      }
    } catch (err) {
      const message = `Network error: ${(err as Error).message}`;
      setError(message);
      appendMessage(current.id, {
        role: "assistant",
        content: `⚠️ ${message}`,
      });
    }
  };

  const send = async () => {
    const text = input.trim();
    const current = getSkill(skillId);
    if (!text || sending || !current) return;
    setError(null);

    const pendingAttachments = current.attachments ?? [];
    appendMessage(current.id, {
      role: "user",
      content: text,
      attachments: pendingAttachments.length ? pendingAttachments : undefined,
    });
    setInput("");
    if (pendingAttachments.length) {
      clearAttachments(current.id);
    }
    setSending(true);

    try {
      await askSkillAi({ skillFileOverride: current.file, attachmentsOverride: pendingAttachments });
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  if (!skill) {
    return (
      <div className="text-[13px] text-text-secondary">
        <Link to="/skills" className="text-blue hover:underline">← All skills</Link>
        <div className="mt-3">Skill not found.</div>
      </div>
    );
  }

  const hasMessages = skill.messages.length > 0;

  return (
    <div className="-mx-4 md:-mx-8 -my-6 md:-my-8 flex h-[calc(100vh-0px)]">
      {/* Main chat column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 pt-6">
          <Link
            to="/skills"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            All skills
          </Link>
        </div>

        <div className="px-6 pt-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {titleEdit ? (
              <input
                autoFocus
                defaultValue={skill.name}
                onBlur={(e) => {
                  renameSkill(skill.id, e.target.value.trim() || "Untitled skill");
                  setTitleEdit(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setTitleEdit(false);
                }}
                className="text-[26px] font-semibold tracking-tight bg-transparent outline-none border-b border-subtle w-full"
              />
            ) : (
              <h1
                onClick={() => setTitleEdit(true)}
                className="text-[26px] font-semibold tracking-tight cursor-text hover:opacity-80"
              >
                {skill.name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-1 relative">
            <button
              className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
              aria-label="Favorite"
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMenu((v) => !v)}
              className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
              aria-label="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menu && (
              <div
                className="absolute right-0 top-10 z-30 min-w-[160px] rounded-lg border border-subtle bg-surface card-shadow py-1 text-[13px]"
                onMouseLeave={() => setMenu(false)}
              >
                <button
                  onClick={() => {
                    setMenu(false);
                    setTitleEdit(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-hover text-left"
                >
                  <FileText className="w-3.5 h-3.5" /> Rename
                </button>
                <button
                  onClick={() => {
                    setMenu(false);
                    if (confirm(`Delete "${skill.name}"?`)) {
                      deleteSkill(skill.id);
                      window.history.back();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-hover text-left text-red"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          {!hasMessages ? (
            <div className="max-w-[720px] mx-auto mt-16 text-center">
              <div className="w-11 h-11 rounded-full bg-raised mx-auto flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-text-secondary" />
              </div>
              <div className="text-[15px] text-text-secondary">
                Describe what this skill should do. Your skill file is built and refined from this conversation.
              </div>
            </div>
          ) : (
            <div className="max-w-[720px] mx-auto space-y-4">
              {skill.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "text-[14px] leading-relaxed",
                    m.role === "user" ? "flex justify-end" : "flex justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 max-w-[85%]",
                      m.role === "user"
                        ? "bg-raised text-text-primary"
                        : "bg-transparent text-text-primary",
                    )}
                  >
                    <MarkdownView content={m.content} compact={m.role === "user"} />
                    {m.role === "user" && (m.attachments?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 justify-end">
                        {m.attachments!.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setPreview({ name: a.name, content: a.content })}
                            className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-surface hover:bg-hover px-2 py-1 text-[12px] text-text-secondary hover:text-text-primary"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="max-w-[180px] truncate">{a.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {m.role === "assistant" && skill.file && (
                      <button
                        onClick={() => setPreview({ name: skill.name, content: skill.file })}
                        className="mt-3 flex items-center gap-2 rounded-lg border border-subtle bg-surface hover:bg-hover px-3 py-2 text-[12px]"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-text-tertiary">· MD</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start text-[14px] leading-relaxed">
                  <div className="rounded-2xl px-4 py-2.5 bg-transparent text-text-secondary">
                    Thinking…
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-6 pb-6">
          <div className="max-w-[720px] mx-auto rounded-2xl border border-subtle bg-surface card-shadow">
            {(skill.attachments?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-3">
                {skill.attachments!.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-raised px-2 py-1 text-[12px] text-text-secondary"
                  >
                    <Paperclip className="w-3 h-3" />
                    <button
                      onClick={() => setPreview({ name: a.name, content: a.content })}
                      className="max-w-[180px] truncate hover:text-text-primary hover:underline"
                    >
                      {a.name}
                    </button>
                    <span className="text-text-tertiary">· {Math.max(1, Math.round(a.size / 1024))} KB</span>
                    <button
                      onClick={() => removeAttachment(skill.id, a.id)}
                      className="ml-0.5 text-text-tertiary hover:text-text-primary"
                      aria-label={`Remove ${a.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={3}
              placeholder="How can I help you today?"
              className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[14px] outline-none placeholder:text-text-tertiary"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.json,.csv,.yaml,.yml,text/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const content = String(reader.result ?? "");
                    addAttachment(skill.id, {
                      name: file.name,
                      type: file.type || "text/plain",
                      size: file.size,
                      content,
                    });
                    requestAnimationFrame(() => inputRef.current?.focus());
                  };
                  reader.onerror = () => {
                    setError(`Could not read ${file.name}. Please upload a text, markdown, CSV, JSON, or YAML file.`);
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
                aria-label="Attach"
                title="Attach a file — the AI reads it when you send your next message"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 relative">
                <button
                  onClick={() => setModelOpen((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md px-2 h-8 text-[12px] text-text-secondary hover:bg-hover"
                >
                  {MODELS.find((m) => m.id === model)?.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {modelOpen && (
                  <div className="absolute right-0 bottom-9 min-w-[200px] rounded-lg border border-subtle bg-surface card-shadow py-1 text-[13px] z-20">
                    {(["Anthropic", "OpenAI", "Google"] as const).map((group, gi) => (
                      <div key={group}>
                        {gi > 0 && <div className="my-1 border-t border-subtle" />}
                        <div className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-text-tertiary">
                          {group}
                        </div>
                        {MODELS.filter((m) => m.group === group).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              selectModel(m.id);
                              setModelOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 hover:bg-hover",
                              m.id === model && "text-blue",
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {currentModel.thinkingMode === "toggle-budget" && (
                  <button
                    onClick={() => setThinkingEnabled((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 h-8 text-[12px]",
                      thinkingEnabled ? "text-blue" : "text-text-tertiary",
                      "hover:bg-hover",
                    )}
                    title={thinkingEnabled ? "Thinking açık — kapatmak için tıkla" : "Thinking kapalı — açmak için tıkla"}
                  >
                    <span
                      className={cn(
                        "inline-block w-2 h-2 rounded-full",
                        thinkingEnabled ? "bg-blue" : "bg-text-tertiary",
                      )}
                    />
                    Thinking
                  </button>
                )}
                {(currentModel.thinkingMode === "adaptive-effort" || thinkingEnabled) && (
                  <>
                    <button
                      onClick={() => setEffortOpen((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-md px-2 h-8 text-[12px] text-text-secondary hover:bg-hover"
                      title="Reasoning effort"
                    >
                      {EFFORT_LABELS[effort]}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {effortOpen && (
                      <div className="absolute right-0 bottom-9 min-w-[120px] rounded-lg border border-subtle bg-surface card-shadow py-1 text-[13px] z-20">
                        {currentModel.efforts.map((e) => (
                          <button
                            key={e}
                            onClick={() => {
                              setEffort(e);
                              setEffortOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 hover:bg-hover",
                              e === effort && "text-blue",
                            )}
                          >
                            {EFFORT_LABELS[e]}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={send}
                  disabled={!input.trim() || sending}
                  className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-text-primary text-[color:var(--tp-base)] disabled:opacity-30 hover:opacity-90"
                  aria-label="Send"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-[720px] mx-auto text-center text-[12px] text-text-tertiary mt-2">
            {error ? `⚠️ ${error}` : "AI references this skill file every time an agent uses it."}
          </div>
        </div>
      </div>

      {/* Side file preview */}
      {preview && (
        <FilePreview
          name={preview.name}
          file={preview.content}
          onClose={() => setPreview(null)}
        />
      )}

      {/* Persistent open button when panel is closed and file exists */}
      {!preview && skill.file && (
        <button
          onClick={() => setPreview({ name: skill.name, content: skill.file })}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-30 inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface hover:bg-hover px-3 h-9 text-[12px] card-shadow"
          aria-label="Open skill file"
        >
          <FileText className="w-3.5 h-3.5" />
          Open file
        </button>
      )}
    </div>
  );
}

function FilePreview({
  name,
  file,
  onClose,
}: {
  name: string;
  file: string;
  onClose: () => void;
}) {
  const normalizedFile = useMemo(() => cleanSkillFile(file), [file]);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copy = async () => {
    const ok = await copyText(normalizedFile);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  const download = () => {
    if (typeof document === "undefined") return;
    const blob = new Blob([normalizedFile], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(name)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      className={cn(
        "shrink-0 border-l border-subtle bg-surface flex flex-col",
        expanded ? "fixed inset-0 z-50 w-auto border-l-0" : "w-[460px] xl:w-[520px]",
      )}
    >
      <div className="flex items-center gap-2 h-12 px-3 border-b border-subtle">
        <FileText className="w-4 h-4 text-text-secondary" />
        <div className="text-[13px] font-medium truncate flex-1">
          {name} <span className="text-text-tertiary">· MD</span>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md hover:bg-hover px-2 h-7 text-[12px] text-text-secondary hover:text-text-primary"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={download}
          className="inline-flex items-center gap-1 rounded-md hover:bg-hover px-2 h-7 text-[12px] text-text-secondary hover:text-text-primary"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-md hover:bg-hover text-text-tertiary hover:text-text-primary"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <Expand className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-hover text-text-tertiary"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className={cn("flex-1 overflow-y-auto px-6 py-6", expanded && "max-w-4xl w-full mx-auto")}>
        {normalizedFile.trim() ? (
          <MarkdownView content={normalizedFile} />
        ) : (
          <div className="text-[13px] text-text-tertiary">
            The skill file is empty. Send a message to start shaping it.
          </div>
        )}
      </div>
    </aside>
  );
}

function MarkdownView({ content, compact = false }: { content: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "text-text-primary break-words",
        compact ? "text-[14px] leading-relaxed" : "text-[14px] leading-7",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mt-1 mb-3 text-[22px] font-semibold tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-5 mb-2 text-[16px] font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-4 mb-1.5 text-[14px] font-semibold">{children}</h3>,
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => <ul className="my-2 ml-5 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-5 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
          code: ({ children }) => (
            <code className="rounded bg-raised px-1 py-0.5 font-mono text-[12px] text-text-primary">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="my-3 max-h-80 overflow-auto rounded-lg border border-subtle bg-raised p-3 font-mono text-[12px] leading-5">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-blue pl-3 text-text-secondary">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-subtle">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-raised">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-subtle last:border-b-0">{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-text-primary whitespace-nowrap">{children}</th>
          ),
          td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
          hr: () => <hr className="my-4 border-subtle" />,
          a: ({ href, children }) => (
            <a className="text-blue hover:underline" href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

const SKILL_FILE_START = "---SKILL FILE START---";
const SKILL_FILE_END = "---SKILL FILE END---";

function cleanSkillFile(src: string): string {
  return src
    .trim()
    // Eski format ile üretilmiş geçmiş skill dosyalarını da temizlemeye devam et (geriye dönük uyumluluk).
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * AI cevabından skill dosyasını çıkarır. Skill dosyası ---SKILL FILE START---
 * ve ---SKILL FILE END--- işaretleyicileri arasında düz markdown olarak gelir
 * (kod bloğuyla sarılmaz), böylece dosyanın içindeki iç içe ``` blokları
 * (kod örnekleri, tablolar vb.) yanlışlıkla dış sınır sanılıp kesilmiyor.
 */
function extractSkillMarkdown(reply: string): string {
  const startIdx = reply.indexOf(SKILL_FILE_START);
  const endIdx = reply.indexOf(SKILL_FILE_END);
  if (startIdx >= 0 && endIdx > startIdx) {
    return cleanSkillFile(reply.slice(startIdx + SKILL_FILE_START.length, endIdx));
  }

  // Geriye dönük uyumluluk: eski ```markdown ... ``` formatıyla gelen cevaplar.
  const fenced = reply.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]?.trim()) return cleanSkillFile(fenced[1]);

  const headingIndex = reply.search(/^#\s+/m);
  if (headingIndex >= 0) return cleanSkillFile(reply.slice(headingIndex));

  return "";
}

/**
 * Chat balonunda kullanıcıya gösterilecek metin: skill dosyası markerları ve
 * içeriği çıkarılmış, sadece AI'nin kısa açıklama cümlesi kalır.
 */
function stripSkillFileFromReply(reply: string): string {
  const startIdx = reply.indexOf(SKILL_FILE_START);
  if (startIdx < 0) return reply.trim();
  const before = reply.slice(0, startIdx).trim();
  const endIdx = reply.indexOf(SKILL_FILE_END);
  const after = endIdx >= 0 ? reply.slice(endIdx + SKILL_FILE_END.length).trim() : "";
  return [before, after].filter(Boolean).join("\n\n").trim();
}


async function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy copy path.
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  return ok;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "skill";
}
