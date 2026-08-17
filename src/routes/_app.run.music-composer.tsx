import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Upload, Download, X, Loader2, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { StepBar, type Step } from "@/components/StepFlow";

export const Route = createFileRoute("/_app/run/music-composer")({
  head: () => ({
    meta: [{ title: "Run Music Composer Agent — TubePilot" }],
  }),
  component: MusicComposerRunPage,
});

const STEPS: Step[] = [
  { key: "theme", title: "Theme" },
  { key: "suno", title: "Suno" },
  { key: "assemble", title: "Assemble" },
  { key: "review", title: "Review" },
];

const BACKEND_URL = () => (import.meta as any).env?.VITE_BACKEND_URL ?? "http://localhost:3000";

type UploadedAudio = { name: string; path: string };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      // "data:audio/mpeg;base64,AAAA..." -> sadece base64 kısmını al
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function MusicComposerRunPage() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [genre, setGenre] = useState("ambient jazz, rainy city nights");
  const [theme, setTheme] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [themeLoading, setThemeLoading] = useState(false);

  const [uploadedAudio, setUploadedAudio] = useState<UploadedAudio[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loopCount, setLoopCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sunoGenerating, setSunoGenerating] = useState(false);
  const [sunoLog, setSunoLog] = useState<string[]>([]);
  const [sunoProgress, setSunoProgress] = useState<{ done: number; total: number } | null>(null);
  const [instrumental, setInstrumental] = useState(true);

  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [mergedAudioPath, setMergedAudioPath] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
  const [assembling, setAssembling] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [metadata, setMetadata] = useState<{ title: string; description: string; tags: string[] } | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  async function postJson<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BACKEND_URL()}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok || (data as any).error) {
      throw new Error((data as any).error ?? "İstek başarısız oldu");
    }
    return data;
  }

  const generateTheme = async () => {
    setError(null);
    setThemeLoading(true);
    try {
      const data = await postJson<{ theme: string; runId: string }>("/api/agents/music/theme", {
        genre,
        runId,
      });
      setTheme(data.theme);
      setRunId(data.runId);
      setStep(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setThemeLoading(false);
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || !runId) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        const data = await postJson<{ filePath: string; filename: string }>(
          "/api/agents/music/upload-audio",
          { filename: file.name, base64, runId },
        );
        setUploadedAudio((prev) => [...prev, { name: data.filename, path: data.filePath }]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeUploaded = (path: string) => {
    setUploadedAudio((prev) => prev.filter((a) => a.path !== path));
  };

  const generateOnSuno = async () => {
    if (!runId || !theme) return;
    setError(null);
    setSunoGenerating(true);
    setSunoLog([]);
    setSunoProgress(null);

    try {
      const res = await fetch(`${BACKEND_URL()}/api/agents/music/suno/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tags: theme, instrumental, runId }),
      });
      if (!res.body) throw new Error("Sunucudan akış alınamadı");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE mesajları boş satırla ayrılır: "event: X\ndata: Y\n\n"
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const eventLine = part.split("\n").find((l) => l.startsWith("event: "));
          const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
          if (!eventLine || !dataLine) continue;
          const eventType = eventLine.slice("event: ".length).trim();
          const data = JSON.parse(dataLine.slice("data: ".length));

          if (eventType === "status") {
            setSunoLog((prev) => [...prev, data.message]);
          } else if (eventType === "progress") {
            setSunoProgress({ done: data.done, total: data.total });
          } else if (eventType === "error") {
            throw new Error(data.error);
          } else if (eventType === "done") {
            const files = data.files as { path: string; filename: string }[];
            setUploadedAudio(files.map((f) => ({ name: f.filename, path: f.path })));
            setSunoLog((prev) => [...prev, `✓ ${files.length} şarkı indirildi.`]);
          }
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSunoGenerating(false);
    }
  };

  const runAssembly = async () => {
    if (!runId || !theme || uploadedAudio.length === 0) return;
    setError(null);
    setAssembling(true);
    try {
      const [mergeRes, thumbRes] = await Promise.all([
        postJson<{ mergedAudioPath: string; mergedAudioUrl: string }>("/api/agents/music/merge-audio", {
          audioPaths: uploadedAudio.map((a) => a.path),
          loopCount,
          runId,
        }),
        postJson<{ thumbnailPath: string; thumbnailUrl: string }>("/api/agents/music/thumbnail", {
          theme,
          runId,
        }),
      ]);
      setMergedAudioUrl(mergeRes.mergedAudioUrl);
      setMergedAudioPath(mergeRes.mergedAudioPath);
      setThumbnailUrl(thumbRes.thumbnailUrl);
      setThumbnailPath(thumbRes.thumbnailPath);

      const videoRes = await postJson<{ videoUrl: string }>("/api/agents/music/render-video", {
        audioPath: mergeRes.mergedAudioPath,
        imagePath: thumbRes.thumbnailPath,
        runId,
      });
      setVideoUrl(videoRes.videoUrl);

      const metaRes = await postJson<{ title: string; description: string; tags: string[] }>(
        "/api/agents/music/metadata",
        { theme },
      );
      setMetadata(metaRes);

      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAssembling(false);
      setRendering(false);
      setMetaLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[720px]">
      <Link
        to="/agents"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Agents
      </Link>

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Music Composer Agent</h1>
        <p className="text-[13px] text-text-secondary mt-1">
          Gerçek AI ile tema, thumbnail, ses birleştirme ve video üretimi. Suno kısmı şimdilik
          manuel — şarkıyı Suno'da üret, indir, buraya yükle.
        </p>
      </div>

      <StepBar steps={STEPS} current={step} onJump={(i) => i <= step && setStep(i)} />

      {error && (
        <div className="rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-[13px] text-red">
          ⚠️ {error}
        </div>
      )}

      {/* ADIM 0 — Tema */}
      {step === 0 && (
        <div className="rounded-xl border border-subtle bg-surface p-5 space-y-3">
          <label className="text-[13px] font-medium text-text-primary">Genre / yönlendirme</label>
          <textarea
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            rows={2}
            className="w-full rounded-md bg-raised border border-subtle px-3 py-2 text-[13px] outline-none focus:border-blue"
          />
          <button
            onClick={generateTheme}
            disabled={themeLoading || !genre.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 disabled:opacity-40 px-4 h-9 text-[13px] font-medium"
          >
            {themeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Tema Üret
          </button>
        </div>
      )}

      {/* ADIM 1 — Suno köprüsü */}
      {step === 1 && theme && (
        <div className="rounded-xl border border-subtle bg-surface p-5 space-y-4">
          <div>
            <div className="text-[12px] text-text-tertiary">Bugünün teması</div>
            <div className="text-[15px] font-medium text-text-primary mt-0.5">{theme}</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="instrumental"
              type="checkbox"
              checked={instrumental}
              onChange={(e) => setInstrumental(e.target.checked)}
              className="rounded border-subtle"
            />
            <label htmlFor="instrumental" className="text-[12.5px] text-text-secondary">
              Enstrümantal (sözsüz)
            </label>
          </div>

          <button
            onClick={generateOnSuno}
            disabled={sunoGenerating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 disabled:opacity-60 px-4 h-10 text-[13.5px] font-medium"
          >
            {sunoGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
            Suno'da Otomatik Üret
          </button>

          {sunoLog.length > 0 && (
            <div className="rounded-lg bg-raised border border-subtle p-3 text-[12px] text-text-secondary space-y-1 max-h-40 overflow-y-auto">
              {sunoLog.map((line, i) => (
                <div key={i}>• {line}</div>
              ))}
              {sunoProgress && (
                <div className="text-text-tertiary">
                  İlerleme: {sunoProgress.done}/{sunoProgress.total}
                </div>
              )}
            </div>
          )}

          {sunoGenerating && (
            <p className="text-[11.5px] text-text-tertiary">
              İlk çalıştırmada bir Chrome penceresi açılabilir — açılırsa Suno'ya normal
              şekilde giriş yap, sonraki seferlerde bu adım otomatik geçilir.
            </p>
          )}

          <div className="flex items-center gap-2">
            <div className="h-px bg-subtle flex-1" />
            <span className="text-[11px] text-text-tertiary">ya da manuel</span>
            <div className="h-px bg-subtle flex-1" />
          </div>

          <div className="rounded-lg bg-raised border border-subtle p-3 text-[12.5px] text-text-secondary leading-relaxed">
            1. <a href="https://suno.com" target="_blank" rel="noreferrer" className="text-blue hover:underline">Suno.com</a>'a git, bu temayla bir şarkı üret.
            <br />
            2. Şarkıyı mp3 olarak indir.
            <br />
            3. Aşağıdan buraya yükle (bir veya daha fazla dosya seçebilirsin).
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-raised hover:bg-hover px-4 h-9 text-[13px] font-medium disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Suno mp3 dosyalarını yükle
          </button>

          {uploadedAudio.length > 0 && (
            <div className="space-y-1.5">
              {uploadedAudio.map((a) => (
                <div
                  key={a.path}
                  className="flex items-center justify-between rounded-md bg-raised border border-subtle px-3 py-1.5 text-[12.5px]"
                >
                  <span className="truncate">{a.name}</span>
                  <button onClick={() => removeUploaded(a.path)} className="text-text-tertiary hover:text-red">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-[12.5px] text-text-secondary">Kaç kez art arda tekrarlansın:</label>
            <input
              type="number"
              min={1}
              max={20}
              value={loopCount}
              onChange={(e) => setLoopCount(Number(e.target.value) || 1)}
              className="w-16 rounded-md bg-raised border border-subtle px-2 py-1 text-[12.5px]"
            />
          </div>

          <button
            onClick={runAssembly}
            disabled={uploadedAudio.length === 0 || assembling}
            className="inline-flex items-center gap-2 rounded-lg bg-text-primary text-[color:var(--tp-base)] hover:opacity-90 disabled:opacity-40 px-4 h-9 text-[13px] font-medium"
          >
            {assembling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Thumbnail + Video + Metadata Üret
          </button>
          <p className="text-[11.5px] text-text-tertiary">
            Bu adım birleşik çalışır: ses dosyalarını birleştirir, thumbnail üretir, video render
            eder ve YouTube metadata'sı yazar — hepsi tek tıkla.
          </p>
        </div>
      )}

      {/* ADIM 3 — Sonuç */}
      {step === 3 && (
        <div className="rounded-xl border border-subtle bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2 text-[13px] text-green">
            <CheckCircle2 className="w-4 h-4" />
            Video hazır
          </div>

          {videoUrl && (
            <video controls src={videoUrl} className="w-full rounded-lg border border-subtle" />
          )}

          {thumbnailUrl && (
            <div>
              <div className="text-[12px] text-text-tertiary mb-1">Thumbnail</div>
              <img src={thumbnailUrl} alt="Thumbnail" className="rounded-lg border border-subtle w-full" />
            </div>
          )}

          {metadata && (
            <div className="space-y-2">
              <div>
                <div className="text-[12px] text-text-tertiary">Başlık</div>
                <div className="text-[14px] font-medium">{metadata.title}</div>
              </div>
              <div>
                <div className="text-[12px] text-text-tertiary">Açıklama</div>
                <div className="text-[13px] text-text-secondary whitespace-pre-wrap">{metadata.description}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {metadata.tags.map((t) => (
                  <span key={t} className="rounded-md bg-raised px-2 py-0.5 text-[11.5px] text-text-secondary">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {videoUrl && (
              <a
                href={videoUrl}
                download
                className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-raised hover:bg-hover px-4 h-9 text-[13px] font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Videoyu indir
              </a>
            )}
            <button
              disabled
              title="YouTube bağlantısı henüz kurulmadı — bu özellik yakında"
              className="inline-flex items-center gap-2 rounded-lg bg-text-primary text-[color:var(--tp-base)] opacity-40 cursor-not-allowed px-4 h-9 text-[13px] font-medium"
            >
              YouTube'a Yayınla (yakında)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
