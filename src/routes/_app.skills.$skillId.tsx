import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  Download,
  FileText,
  History,
  MemoryStick,
  MessageSquareText,
  Paperclip,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  SplitSquareHorizontal,
  Upload,
  User as UserIcon,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mockSkills } from "@/mock/data";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/skills/$skillId")({
  loader: ({ params }) => {
    const skill = mockSkills.find((s) => s.id === params.skillId);
    if (!skill) throw notFound();
    return { skill };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.skill.name} — Skill Studio` : "Skill Studio" }],
  }),
  component: SkillStudio,
  notFoundComponent: () => (
    <div className="p-8 text-text-secondary">Skill not found.</div>
  ),
});

type Provider = "ChatGPT" | "Claude" | "Gemini" | "Lovable AI";
type ModelId =
  | "openai/gpt-5.6-sol"
  | "openai/gpt-5.5"
  | "openai/gpt-5.4-mini"
  | "anthropic/claude-opus-4.1"
  | "anthropic/claude-sonnet-4.5"
  | "anthropic/claude-haiku-4.5"
  | "google/gemini-3.1-pro-preview"
  | "google/gemini-3-flash-preview";

const MODELS: Array<{
  id: ModelId;
  label: string;
  provider: Provider;
  note: string;
  dot: string;
}> = [
  {
    id: "openai/gpt-5.6-sol",
    label: "ChatGPT — GPT-5.6 Sol",
    provider: "ChatGPT",
    note: "Best for full rewrites",
    dot: "bg-green",
  },
  {
    id: "openai/gpt-5.5",
    label: "ChatGPT — GPT-5.5",
    provider: "ChatGPT",
    note: "Precise editor",
    dot: "bg-green",
  },
  {
    id: "openai/gpt-5.4-mini",
    label: "ChatGPT — GPT-5.4 Mini",
    provider: "ChatGPT",
    note: "Fast drafts",
    dot: "bg-green",
  },
  {
    id: "anthropic/claude-opus-4.1",
    label: "Claude — Opus 4.1",
    provider: "Claude",
    note: "Deep reasoning",
    dot: "bg-orange",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    label: "Claude — Sonnet 4.5",
    provider: "Claude",
    note: "Balanced skill writing",
    dot: "bg-orange",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Claude — Haiku 4.5",
    provider: "Claude",
    note: "Quick edits",
    dot: "bg-orange",
  },
  {
    id: "google/gemini-3.1-pro-preview",
    label: "Gemini — 3.1 Pro",
    provider: "Gemini",
    note: "Long context",
    dot: "bg-blue",
  },
  {
    id: "google/gemini-3-flash-preview",
    label: "Lovable AI — Gemini 3 Flash",
    provider: "Lovable AI",
    note: "Default workspace model",
    dot: "bg-blue",
  },
];

type Version = {
  id: string;
  title: string;
  savedAt: string;
  author: "You" | "AI" | "Upload";
  model?: ModelId;
  note: string;
  content: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: ModelId;
  proposal?: string;
};

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  content: string;
};

const starterPrompts = [
  "Bu skill dosyasını baştan sona daha profesyonel yaz",
  "Agent'ın output formatını tablo gibi netleştir",
  "Eksik edge-case ve yasakları ekle",
  "Önceki versiyona göre daha kısa ve uygulanabilir yap",
];

function getTimeLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function wordsOf(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function nextSkillDraft(prompt: string, current: string, memory: string[], model: ModelId) {
  const lower = prompt.toLowerCase();
  const wantsNew = lower.includes("sıfır") || lower.includes("from scratch") || lower.includes("baştan");
  const wantsTable = lower.includes("tablo") || lower.includes("format") || lower.includes("output");
  const wantsShort = lower.includes("kısa") || lower.includes("short");
  const wantsRules = lower.includes("edge") || lower.includes("yasak") || lower.includes("rule");

  const header = `# Skill: ${wantsNew ? "Production-Ready Agent Guideline" : "Refined Skill File"}`;
  const memoryBlock = memory.length
    ? `\n\n## Persistent Memory\n${memory.slice(-5).map((m) => `- ${m}`).join("\n")}`
    : "";
  const modelTone = model.includes("claude")
    ? "Prefer careful reasoning and explicit constraints."
    : model.includes("openai")
      ? "Prefer crisp actionable instructions and strong structure."
      : "Prefer broad context awareness and concise execution.";

  if (wantsShort) {
    return `${header}\n\n## Role\nTurn user intent into clean, reusable agent instructions.\n\n## Rules\n- Be specific.\n- Preserve the user’s style.\n- Output only usable skill content.\n\n## Output\nReturn markdown with clear headings.\n\n## Model Guidance\n${modelTone}${memoryBlock}`;
  }

  const formatBlock = wantsTable
    ? `\n\n## Output Format\nUse this structure every time:\n\n| Section | Requirement | Example |\n|---|---|---|\n| Role | What the agent is | Expert video script skill |\n| Inputs | Required fields | topic, duration, tone |\n| Rules | Hard constraints | no filler, no generic hooks |\n| Output | Exact response shape | scenes, prompts, metadata |`
    : `\n\n## Output Format\nReturn a polished markdown skill file with Role, Inputs, Process, Rules, Output, and Quality Bar sections.`;

  const rulesBlock = wantsRules
    ? `\n\n## Hard Rules\n- Never invent unavailable facts.\n- Never produce vague instructions like “make it engaging”.\n- Always define exact output fields.\n- Always include negative constraints and quality checks.\n- Preserve previous approved memory unless the user overrides it.`
    : `\n\n## Quality Bar\n- Each instruction must be executable by an AI agent.\n- Avoid generic advice.\n- Prefer measurable constraints over style adjectives.\n- Keep the file reusable across runs.`;

  return `${header}\n\n## Role\nYou are a specialist skill file used by TubePilot agents. Convert user goals into repeatable production behavior.\n\n## Inputs\n- Agent type\n- Channel theme\n- Target platform\n- Duration or schedule\n- User notes and style preferences\n\n## Process\n1. Read the user’s latest request.\n2. Compare it against saved memory and previous skill versions.\n3. Produce a concrete, reusable instruction set.\n4. Include examples only when they clarify execution.\n5. Keep every rule compatible with automated workflows.${formatBlock}${rulesBlock}\n\n## Model Guidance\n${modelTone}\n\n## Current Source Snapshot\n${current.slice(0, 900)}${current.length > 900 ? "…" : ""}${memoryBlock}`;
}

function SkillStudio() {
  const { skill } = Route.useLoaderData();
  const [text, setText] = useState(skill.instructions);
  const [savedText, setSavedText] = useState(skill.instructions);
  const [activeVersionId, setActiveVersionId] = useState("initial");
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "initial",
      title: "Initial import",
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      author: "You",
      note: "Original skill from TubePilot library",
      content: skill.instructions,
    },
    {
      id: "checkpoint-1",
      title: "AI cleanup draft",
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      author: "AI",
      model: "anthropic/claude-sonnet-4.5",
      note: "Structure and constraints improved",
      content: `${skill.instructions}\n\nQuality check: every generated output must be ready for an automated agent step.`,
    },
  ]);
  const [model, setModel] = useState<ModelId>("anthropic/claude-sonnet-4.5");
  const [modelOpen, setModelOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<Provider | "All">("All");
  const [memory, setMemory] = useState<string[]>([
    `Skill: ${skill.name}`,
    `Category: ${skill.category}`,
    `Used in: ${skill.usedIn}`,
    "Keep old versions accessible before applying AI rewrites.",
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-init",
      role: "assistant",
      content:
        "Skill Studio hazır. Ben bu skill dosyasının hafızasını ve eski versiyonlarını dikkate alarak yeni skill dosyaları oluşturabilir, yüklediğin dosyayı düzenleyebilir ve değişikliği önce öneri olarak gösterebilirim.",
      model: "anthropic/claude-sonnet-4.5",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [testInput, setTestInput] = useState("Topic: The abandoned city under the lake\nDuration: 6-10 minutes\nTone: cinematic documentary");
  const [testOutput, setTestOutput] = useState("Run a test to preview how this skill responds.");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const currentModel = MODELS.find((m) => m.id === model) ?? MODELS[4];
  const dirty = text !== savedText;
  const filteredModels = activeProvider === "All" ? MODELS : MODELS.filter((m) => m.provider === activeProvider);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages, sending]);

  const saveVersion = (author: Version["author"], note: string, content = text, versionModel = model) => {
    const next: Version = {
      id: `v-${Date.now()}`,
      title: `${author === "AI" ? "AI rewrite" : author === "Upload" ? "Uploaded file" : "Manual save"} v${versions.length + 1}`,
      savedAt: new Date().toISOString(),
      author,
      model: author === "AI" ? versionModel : undefined,
      note,
      content,
    };
    setVersions((prev) => [next, ...prev]);
    setActiveVersionId(next.id);
    setSavedText(content);
  };

  const restore = (version: Version) => {
    setText(version.content);
    setActiveVersionId(version.id);
    setMessages((prev) => [
      ...prev,
      {
        id: `restore-${Date.now()}`,
        role: "assistant",
        content: `Loaded version: **${version.title}**. You can edit it, ask AI to improve it, or save it as a new version.`,
        model,
      },
    ]);
  };

  const applyProposal = (proposal: string, sourceModel?: ModelId) => {
    setText(proposal);
    setSavedText(proposal);
    saveVersion("AI", "Applied from AI chat", proposal, sourceModel ?? model);
    setMemory((prev) => [...prev, "AI proposal applied and saved as a new version."].slice(-12));
  };

  const send = () => {
    const prompt = input.trim();
    if (!prompt || sending) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setMemory((prev) => [...prev, `User request: ${prompt.slice(0, 90)}`].slice(-12));

    window.setTimeout(() => {
      const proposal = nextSkillDraft(prompt, text, memory, model);
      const reply =
        `Hazırladım. ${currentModel.label} bu skill dosyasını mevcut hafıza, aktif metin ve önceki versiyon mantığına göre yeniden düzenledi. ` +
        `Aşağıdaki öneriyi **Apply & save version** ile dosyaya uygulayabilirsin.`;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply,
          model,
          proposal,
        },
      ]);
      setSending(false);
    }, 900);
  };

  const onUpload = async (file: File) => {
    const content = await file.text();
    const uploaded: UploadedFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      content,
    };
    setUploadedFiles((prev) => [uploaded, ...prev]);
    setText(content);
    setSavedText(content);
    saveVersion("Upload", `Imported ${file.name}`, content);
    setMemory((prev) => [...prev, `Uploaded skill file: ${file.name}`].slice(-12));
    setMessages((prev) => [
      ...prev,
      {
        id: `upload-${Date.now()}`,
        role: "assistant",
        content: `**${file.name}** yüklendi ve yeni versiyon olarak kaydedildi. Şimdi bu dosyayı ChatGPT, Claude veya Gemini ile düzenletebilirsin.`,
        model,
      },
    ]);
  };

  const copyText = async () => {
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${skill.id}.skill.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runTest = () => {
    setTestOutput(
      `# Test Output\n\nUsing **${skill.name}**, the agent would produce:\n\n- Hook: A hidden place changes everything in the first 3 seconds.\n- Structure: 12 scenes, each with narration, visual prompt, and pacing.\n- Input used: ${testInput.split("\n")[0] ?? "sample"}\n\nQuality check passed: output follows the active skill file.`,
    );
  };

  const stats = useMemo(
    () => [
      { label: "Words", value: wordsOf(text).toLocaleString() },
      { label: "Versions", value: versions.length.toString() },
      { label: "Memory", value: memory.length.toString() },
      { label: "Files", value: uploadedFiles.length.toString() },
    ],
    [text, versions.length, memory.length, uploadedFiles.length],
  );

  return (
    <div className="min-h-[calc(100vh-40px)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/skills"
            className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-surface px-2.5 h-8 text-[12px] font-medium text-text-secondary hover:text-text-primary hover:bg-hover"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Skills
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold tracking-tight">{skill.name}</h1>
            <p className="text-[12px] text-text-secondary">
              AI-assisted skill file editor · versions · memory · uploads
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dirty && (
            <span className="inline-flex h-8 items-center rounded-md bg-orange px-2.5 text-[12px] font-semibold text-white">
              Unsaved
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".md,.txt,.skill,.mdc"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
              e.currentTarget.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-subtle bg-surface px-3 text-[13px] font-semibold text-text-primary hover:bg-hover"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload skill
          </button>
          <button
            onClick={copyText}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-subtle bg-surface px-3 text-[13px] font-semibold text-text-primary hover:bg-hover"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={download}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-subtle bg-surface px-3 text-[13px] font-semibold text-text-primary hover:bg-hover"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            disabled={!dirty}
            onClick={() => saveVersion("You", "Manual save")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue px-3.5 text-[13px] font-semibold text-white hover:bg-blue/90 disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            Save version
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-lg border border-subtle bg-surface px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{item.label}</div>
            <div className="text-[18px] font-semibold text-text-primary">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 xl:col-span-3 space-y-4">
          <Panel title="Version history" icon={History} action={`${versions.length}`}>
            <div className="max-h-[360px] overflow-auto divide-y divide-subtle">
              {versions.map((version) => {
                const isActive = version.id === activeVersionId;
                const modelMeta = MODELS.find((m) => m.id === version.model);
                return (
                  <button
                    key={version.id}
                    onClick={() => restore(version)}
                    className={cn(
                      "w-full p-3 text-left transition-colors hover:bg-hover",
                      isActive && "bg-blue/10",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-text-primary">{version.title}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-secondary">
                          {version.author === "AI" ? <Bot className="h-3 w-3" /> : version.author === "Upload" ? <Paperclip className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                          {version.author}
                          {modelMeta ? ` · ${modelMeta.provider}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-[10.5px] text-text-tertiary">{getTimeLabel(version.savedAt)}</div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11.5px] text-text-tertiary">{version.note}</p>
                    {isActive && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue px-2 py-0.5 text-[10.5px] font-semibold text-white">
                        <RotateCcw className="h-3 w-3" /> loaded
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="AI memory" icon={MemoryStick} action="persistent">
            <div className="space-y-2 p-3">
              {memory.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-md border border-subtle bg-base px-2.5 py-2 text-[11.5px] leading-relaxed text-text-secondary">
                  {item}
                </div>
              ))}
              <button
                onClick={() => setMemory((prev) => [...prev, `Manual memory ${prev.length + 1}: always keep outputs production-ready.`])}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-subtle bg-surface px-2.5 text-[12px] font-semibold text-text-primary hover:bg-hover"
              >
                <Plus className="h-3.5 w-3.5" /> Add memory
              </button>
            </div>
          </Panel>

          <Panel title="Uploaded files" icon={FileText} action={`${uploadedFiles.length}`}>
            <div className="p-3 space-y-2">
              {uploadedFiles.length === 0 ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-lg border border-dashed border-subtle bg-base px-3 py-5 text-center text-[12px] font-medium text-text-secondary hover:bg-hover"
                >
                  Upload a skill file and edit it with AI
                </button>
              ) : (
                uploadedFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setText(file.content)}
                    className="w-full rounded-md border border-subtle bg-base px-2.5 py-2 text-left hover:bg-hover"
                  >
                    <div className="truncate text-[12px] font-semibold text-text-primary">{file.name}</div>
                    <div className="text-[10.5px] text-text-tertiary">{Math.max(1, Math.round(file.size / 1024))} KB</div>
                  </button>
                ))
              )}
            </div>
          </Panel>
        </aside>

        <main className="col-span-12 xl:col-span-5">
          <Panel title="Skill file editor" icon={Code2} action={`${text.length} chars`} fullHeight>
            <div className="flex h-full min-h-[780px] flex-col">
              <div className="flex flex-wrap items-center gap-2 border-b border-subtle bg-raised/40 px-3 py-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue px-2.5 py-1 text-[11px] font-semibold text-white">
                  <SplitSquareHorizontal className="h-3 w-3" /> Live skill file
                </span>
                <span className="text-[11px] text-text-tertiary">Markdown · editable · versioned</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                className="min-h-[600px] flex-1 resize-none bg-base p-4 font-mono text-[13px] leading-relaxed text-text-primary outline-none focus:ring-2 focus:ring-blue/40"
              />
              <div className="grid grid-cols-1 gap-3 border-t border-subtle bg-raised/40 p-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-text-secondary">Category</span>
                  <input value={skill.category} readOnly className="h-9 w-full rounded-md border border-subtle bg-surface px-2.5 text-[13px]" />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-text-secondary">Used in</span>
                  <input value={skill.usedIn} readOnly className="h-9 w-full rounded-md border border-subtle bg-surface px-2.5 text-[13px]" />
                </label>
              </div>
            </div>
          </Panel>
        </main>

        <aside className="col-span-12 xl:col-span-4 space-y-4">
          <Panel title="AI skill builder" icon={Sparkles} action={currentModel.provider}>
            <div className="border-b border-subtle p-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(["All", "ChatGPT", "Claude", "Gemini", "Lovable AI"] as const).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setActiveProvider(provider)}
                    className={cn(
                      "h-7 rounded-full border px-2.5 text-[11.5px] font-semibold",
                      activeProvider === provider
                        ? "border-blue bg-blue text-white"
                        : "border-subtle bg-surface text-text-secondary hover:bg-hover hover:text-text-primary",
                    )}
                  >
                    {provider}
                  </button>
                ))}
              </div>

              <div className="relative">
                <button
                  onClick={() => setModelOpen((v) => !v)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-subtle bg-surface px-3 text-left hover:bg-hover"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", currentModel.dot)} />
                    <span className="truncate text-[13px] font-semibold text-text-primary">{currentModel.label}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-text-tertiary" />
                </button>
                {modelOpen && (
                  <div className="absolute left-0 right-0 top-11 z-30 max-h-72 overflow-auto rounded-lg border border-subtle bg-surface py-1 card-shadow">
                    {filteredModels.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setModel(item.id);
                          setModelOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-hover",
                          item.id === model && "bg-blue/10",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-[12.5px] font-semibold text-text-primary">
                            <span className={cn("h-2 w-2 rounded-full", item.dot)} />
                            {item.label}
                          </span>
                          <span className="block text-[10.5px] text-text-tertiary">{item.note}</span>
                        </span>
                        {item.id === model && <Check className="h-3.5 w-3.5 text-blue" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div ref={chatRef} className="max-h-[510px] min-h-[430px] overflow-auto p-3 space-y-3">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} onApply={applyProposal} activeModel={model} />
              ))}
              {sending && (
                <div className="flex gap-2">
                  <Avatar role="assistant" />
                  <div className="rounded-lg bg-raised px-3 py-2 text-[12px] text-text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary [animation-delay:240ms]" />
                      building skill draft
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-subtle p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-full border border-subtle bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-hover hover:text-text-primary"
                  >
                    {prompt}
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
                  rows={3}
                  placeholder="AI'a nasıl bir skill dosyası istediğini yaz…"
                  className="min-h-20 flex-1 resize-none rounded-md border border-subtle bg-raised p-2.5 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-blue/40"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue text-white hover:bg-blue/90 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="Skill test" icon={Play} action="preview">
            <div className="grid gap-3 p-3">
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-text-secondary">Sample input</span>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-md border border-subtle bg-base p-2.5 text-[12.5px] outline-none focus:ring-2 focus:ring-blue/40"
                />
              </label>
              <button
                onClick={runTest}
                className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md bg-blue px-3 text-[13px] font-semibold text-white hover:bg-blue/90"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Run skill test
              </button>
              <div className="min-h-32 rounded-md border border-subtle bg-base p-3 font-mono text-[12px] leading-relaxed text-text-secondary whitespace-pre-wrap">
                {testOutput}
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  action,
  children,
  fullHeight,
}: {
  title: string;
  icon: LucideIcon;
  action?: string;
  children: React.ReactNode;
  fullHeight?: boolean;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-subtle bg-surface card-shadow", fullHeight && "h-full")}>
      <div className="flex h-11 items-center justify-between border-b border-subtle px-3">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          <Icon className="h-3.5 w-3.5 text-blue" />
          {title}
        </div>
        {action && <span className="rounded-full bg-raised px-2 py-0.5 text-[10.5px] font-semibold text-text-secondary">{action}</span>}
      </div>
      {children}
    </section>
  );
}

function Avatar({ role }: { role: ChatMessage["role"] }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        role === "user" ? "bg-blue text-white" : "bg-raised text-text-primary",
      )}
    >
      {role === "user" ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
    </div>
  );
}

function ChatBubble({
  message,
  onApply,
  activeModel,
}: {
  message: ChatMessage;
  onApply: (proposal: string, model?: ModelId) => void;
  activeModel: ModelId;
}) {
  const meta = MODELS.find((m) => m.id === (message.model ?? activeModel));
  return (
    <div className={cn("flex gap-2", message.role === "user" && "flex-row-reverse")}>
      <Avatar role={message.role} />
      <div className={cn("min-w-0 max-w-[88%]", message.role === "user" && "items-end")}>
        <div
          className={cn(
            "rounded-xl px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap",
            message.role === "user" ? "bg-blue text-white" : "bg-raised text-text-primary",
          )}
        >
          {message.content}
        </div>
        {message.proposal && (
          <div className="mt-2 overflow-hidden rounded-lg border border-subtle bg-base">
            <div className="flex items-center justify-between gap-2 border-b border-subtle bg-surface px-3 py-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                <MessageSquareText className="h-3.5 w-3.5 text-blue" />
                Proposed skill file
              </div>
              <button
                onClick={() => onApply(message.proposal!, message.model)}
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-blue px-2.5 text-[11.5px] font-semibold text-white hover:bg-blue/90"
              >
                <Check className="h-3.5 w-3.5" />
                Apply & save version
              </button>
            </div>
            <pre className="max-h-56 overflow-auto p-3 font-mono text-[11.5px] leading-relaxed text-text-secondary whitespace-pre-wrap">
              {message.proposal}
            </pre>
          </div>
        )}
        {message.role === "assistant" && meta && (
          <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-text-tertiary">
            <Clock3 className="h-3 w-3" />
            {meta.label}
          </div>
        )}
      </div>
    </div>
  );
}