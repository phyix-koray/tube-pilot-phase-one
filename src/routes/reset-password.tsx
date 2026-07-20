import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password — TubePilot" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setOk(true);
      setTimeout(() => navigate({ to: "/agents" }), 1200);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-subtle bg-surface card-shadow p-6 space-y-4"
      >
        <div>
          <h1 className="text-[20px] font-semibold">Set a new password</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Enter a new password for your account.
          </p>
        </div>

        <label className="block">
          <div className="text-[11px] font-medium text-text-secondary mb-1">New password</div>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="password"
              required
              minLength={6}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full h-10 rounded-lg bg-raised border border-subtle pl-9 pr-3 text-[13px] outline-none focus:border-text-primary"
            />
          </div>
        </label>

        {err && (
          <div className="text-[12px] text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        {ok && (
          <div className="text-[12px] text-text-primary bg-raised border border-subtle rounded-lg px-3 py-2">
            Password updated. Redirecting…
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-10 rounded-lg bg-text-primary text-[color:var(--tp-base)] font-semibold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
        </button>
      </form>
    </div>
  );
}
