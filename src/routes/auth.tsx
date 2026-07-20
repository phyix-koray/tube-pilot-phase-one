import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TubePilot" },
      { name: "description", content: "Sign in or create your TubePilot account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/agents" });
  }, [authLoading, user, navigate]);

  const configured = isSupabaseConfigured();

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/agents" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        setOk("Check your email to confirm your account (or sign in if confirmation is disabled).");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setOk("Password reset email sent. Check your inbox.");
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Google sign-in failed.");
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base p-6">
        <div className="max-w-md w-full rounded-xl border border-subtle bg-surface p-6 space-y-3">
          <h1 className="text-lg font-semibold">Supabase not configured</h1>
          <p className="text-[13px] text-text-secondary">
            Please provide the Project URL and anon key in{" "}
            <code className="text-text-primary">src/integrations/supabase/config.ts</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-[26px] font-semibold tracking-tight">TubePilot</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            {mode === "signup"
              ? "Create your account"
              : mode === "forgot"
                ? "Reset your password"
                : "Welcome back"}
          </p>
        </div>

        <div className="rounded-xl border border-subtle bg-surface card-shadow p-6 space-y-4">
          {mode !== "forgot" && (
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full h-10 rounded-lg border border-subtle bg-raised hover:bg-hover text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.9 3l5.7-5.7C33.9 6.2 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3 0 5.7 1.1 7.9 3l5.7-5.7C33.9 6.2 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.7-3.1-11.3-7.7l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.2 5.2c-.4.3 6.5-4.7 6.5-14.5 0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {mode !== "forgot" && (
            <div className="flex items-center gap-3">
              <div className="h-px bg-subtle flex-1" />
              <span className="text-[11px] text-text-tertiary uppercase tracking-wider">or</span>
              <div className="h-px bg-subtle flex-1" />
            </div>
          )}

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 rounded-lg bg-raised border border-subtle px-3 text-[13px] outline-none focus:border-text-primary"
                />
              </Field>
            )}
            <Field label="Email" icon={<Mail className="w-3.5 h-3.5" />}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 rounded-lg bg-raised border border-subtle pl-9 pr-3 text-[13px] outline-none focus:border-text-primary"
              />
            </Field>
            {mode !== "forgot" && (
              <Field label="Password" icon={<Lock className="w-3.5 h-3.5" />}>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-lg bg-raised border border-subtle pl-9 pr-3 text-[13px] outline-none focus:border-text-primary"
                />
              </Field>
            )}

            {err && (
              <div className="text-[12px] text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">
                {err}
              </div>
            )}
            {ok && (
              <div className="text-[12px] text-text-primary bg-raised border border-subtle rounded-lg px-3 py-2">
                {ok}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-10 rounded-lg bg-text-primary text-[color:var(--tp-base)] font-semibold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "signin" && "Sign in"}
                  {mode === "signup" && "Create account"}
                  {mode === "forgot" && "Send reset link"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-[12px] text-text-tertiary flex flex-wrap gap-x-2 gap-y-1 justify-center">
            {mode === "signin" && (
              <>
                <span>New here?</span>
                <button className="text-text-primary underline" onClick={() => setMode("signup")}>
                  Create an account
                </button>
                <span>·</span>
                <button className="text-text-primary underline" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                <span>Already have an account?</span>
                <button className="text-text-primary underline" onClick={() => setMode("signin")}>
                  Sign in
                </button>
              </>
            )}
            {mode === "forgot" && (
              <button className="text-text-primary underline" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-4 text-[11px] text-text-tertiary">
          <Link to="/" className="hover:text-text-primary">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-text-secondary mb-1">{label}</div>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {icon}
          </span>
        )}
        {children}
      </div>
    </label>
  );
}
