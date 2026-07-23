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
  appendMessage,
  deleteSkill,
  getSkill,
  renameSkill,
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

    const header = current.file.trim()
      ? current.file
      : `# ${current.name}\n\nThis skill guides the AI when generating content for your agents.\n\n## Rules\n`;
    const nextFile = `${header}\n- ${text}`;
    updateSkillFile(current.id, nextFile);

    try {
      await askSkillAi({ skillFileOverride: nextFile });
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
                      "rounded-2xl px-4 py-2.5 max-w-[85%] whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-raised text-text-primary"
                        : "bg-transparent text-text-primary",
                    )}
                  >
                    {m.content}
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
                    const userMsg = `📎 Attached **${file.name}** (${Math.round(file.size / 100) / 10} KB). Full contents:\n\n\`\`\`\n${content}\n\`\`\`\n\nFold this into the skill file and remember it for later questions.`;
                    appendMessage(skill.id, { role: "user", content: userMsg });

                    // Update the skill file immediately so preview reflects the upload.
                    const header = skill.file.trim()
                      ? skill.file
                      : `# ${skill.name}\n\nThis skill guides the AI when generating content for your agents.\n`;
                    setSending(true);
                    try {
                      const nextFile = `${header}\n\n## From ${file.name}\n\n${content.trim()}\n`;
                      updateSkillFile(skill.id, nextFile);
                      await askSkillAi({
                        skillFileOverride: nextFile,
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
  const html = useMemo(() => renderMarkdown(file), [file]);

  const copy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(file);
    }
  };

  return (
    <aside className="w-[460px] xl:w-[520px] shrink-0 border-l border-subtle bg-surface flex flex-col">
      <div className="flex items-center gap-2 h-12 px-3 border-b border-subtle">
        <FileText className="w-4 h-4 text-text-secondary" />
        <div className="text-[13px] font-medium truncate flex-1">
          {name} <span className="text-text-tertiary">· MD</span>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md hover:bg-hover px-2 h-7 text-[12px] text-text-secondary"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-hover text-text-tertiary"
          aria-label="Expand"
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
      <div className="flex-1 overflow-y-auto px-6 py-6 prose-md">
        {file.trim() ? (
          <div
            className="text-[14px] leading-relaxed text-text-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="text-[13px] text-text-tertiary">
            The skill file is empty. Send a message to start shaping it.
          </div>
        )}
      </div>
    </aside>
  );
}

/** Minimal markdown renderer sufficient for headings, bullets, bold. */
function renderMarkdown(src: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const lines = src.split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (/^#\s+/.test(line)) {
      closeList();
      out.push(
        `<h1 style="font-size:20px;font-weight:600;margin:16px 0 8px">${esc(line.replace(/^#\s+/, ""))}</h1>`,
      );
    } else if (/^##\s+/.test(line)) {
      closeList();
      out.push(
        `<h2 style="font-size:16px;font-weight:600;margin:14px 0 6px">${esc(line.replace(/^##\s+/, ""))}</h2>`,
      );
    } else if (/^-\s+/.test(line)) {
      if (!inList) {
        out.push('<ul style="padding-left:1.1rem;margin:6px 0;list-style:disc">');
        inList = true;
      }
      out.push(
        `<li style="margin:2px 0">${esc(line.replace(/^-\s+/, "")).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`,
      );
    } else if (line.trim() === "") {
      closeList();
      out.push("<div style='height:6px'></div>");
    } else {
      closeList();
      out.push(
        `<p style="margin:6px 0">${esc(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`,
      );
    }
  }
  closeList();
  return out.join("");
}
