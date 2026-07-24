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

const MODELS = [
  { id: "claude-sonnet-5", label: "Sonnet 5" },
  { id: "claude-opus-5", label: "Opus 5" },
  { id: "gpt-5.6", label: "GPT-5.6" },
  { id: "gemini-3-pro", label: "Gemini 3 Pro" },
] as const;

function SkillDetailPage() {
  const { skillId } = useParams({ from: "/_app/skills/$skillId" });
  const skill = useSkill(skillId);

  const [input, setInput] = useState("");
  const [model, setModel] = useState<(typeof MODELS)[number]["id"]>("claude-sonnet-5");
  const [modelOpen, setModelOpen] = useState(false);
  const [preview, setPreview] = useState(false);
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
  }: {
    skillFileOverride?: string;
  }) => {
    const current = getSkill(skillId);
    if (!current) return;
    const history = current.messages.map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("/api/chat-skill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history,
          model,
          skillName: current.name,
          skillFile: skillFileOverride ?? current.file,
          attachments: current.attachments ?? [],
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
        appendMessage(current.id, { role: "assistant", content: reply });
        const nextSkillFile = extractSkillMarkdown(reply);
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
    appendMessage(current.id, { role: "user", content: text });
    setInput("");
    setSending(true);

    try {
      await askSkillAi({ skillFileOverride: current.file });
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
                    {m.role === "assistant" && skill.file && (
                      <button
                        onClick={() => setPreview(true)}
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
                  reader.onload = async () => {
                    const content = String(reader.result ?? "");
                    addAttachment(skill.id, {
                      name: file.name,
                      type: file.type || "text/plain",
                      size: file.size,
                      content,
                    });
                    const userMsg = `📎 Attached **${file.name}** (${Math.round(file.size / 100) / 10} KB).\n\nRead this attachment carefully, fold the relevant instructions into the skill file, and remember it for later questions.`;
                    appendMessage(skill.id, { role: "user", content: userMsg });

                    const latest = getSkill(skill.id);
                    const header = latest?.file.trim()
                      ? latest.file
                      : `# ${skill.name}\n\nThis skill guides the AI when generating content for your agents.\n`;
                    setSending(true);
                    try {
                      const nextFile = mergeAttachmentIntoSkillFile({
                        currentFile: header,
                        fileName: file.name,
                        content,
                      });
                      updateSkillFile(skill.id, nextFile);
                      const latestWithAttachment = getSkill(skill.id);
                      await askSkillAi({
                        skillFileOverride: latestWithAttachment?.file ?? nextFile,
                      });
                    } catch (err) {
                      appendMessage(skill.id, {
                        role: "assistant",
                        content: `⚠️ Network error: ${(err as Error).message}`,
                      });
                    } finally {
                      setSending(false);
                      requestAnimationFrame(() => inputRef.current?.focus());
                    }
                  };
                  reader.onerror = () => {
                    appendMessage(skill.id, {
                      role: "assistant",
                      content: `⚠️ Could not read ${file.name}. Please upload a text, markdown, CSV, JSON, or YAML file.`,
                    });
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
                aria-label="Attach"
                title="Attach a file — the AI will fold it into your skill"
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
                  <div className="absolute right-0 bottom-9 min-w-[160px] rounded-lg border border-subtle bg-surface card-shadow py-1 text-[13px] z-20">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m.id);
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
          name={skill.name}
          file={skill.file}
          onClose={() => setPreview(false)}
        />
      )}

      {/* Persistent open button when panel is closed and file exists */}
      {!preview && skill.file && (
        <button
          onClick={() => setPreview(true)}
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

function cleanSkillFile(src: string): string {
  return src
    .trim()
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractSkillMarkdown(reply: string): string {
  const fenced = reply.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]?.trim()) return cleanSkillFile(fenced[1]);

  const headingIndex = reply.search(/^#\s+/m);
  if (headingIndex >= 0) return cleanSkillFile(reply.slice(headingIndex));

  return "";
}

function mergeAttachmentIntoSkillFile({
  currentFile,
  fileName,
  content,
}: {
  currentFile: string;
  fileName: string;
  content: string;
}) {
  const cleaned = cleanSkillFile(content);
  if (/^#\s+/m.test(cleaned) && cleaned.length > currentFile.trim().length) {
    return cleaned;
  }
  const base = cleanSkillFile(currentFile);
  return `${base}\n\n## Attached source: ${fileName}\n\n\`\`\`text\n${content.trim()}\n\`\`\``.trim();
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
