import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing in — TubePilot" },
      { name: "description", content: "Completing your TubePilot sign-in." },
      { property: "og:title", content: "Signing in — TubePilot" },
      { property: "og:description", content: "Completing your TubePilot sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeSignIn() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }

        for (let attempt = 0; attempt < 12; attempt += 1) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (data.session) {
            if (!cancelled) navigate({ to: "/agents", replace: true });
            return;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        }

        if (!cancelled) {
          setError(
            `Sign-in returned without a session. Add this exact URL pattern to Supabase Redirect URLs: ${window.location.origin}/**`,
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Sign-in could not be completed.");
      }
    }

    void completeSignIn();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-6">
      <div className="w-full max-w-md rounded-xl border border-subtle bg-surface card-shadow p-6 text-center">
        {!error ? (
          <>
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-text-secondary" />
            <h1 className="mt-4 text-lg font-semibold">Signing you in</h1>
            <p className="mt-2 text-sm text-text-secondary">Completing Google authentication…</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Google sign-in needs one more setting</h1>
            <p className="mt-2 text-sm text-text-secondary break-words">{error}</p>
            <a
              href="/auth"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-text-primary px-4 text-sm font-semibold text-[color:var(--tp-base)]"
            >
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}