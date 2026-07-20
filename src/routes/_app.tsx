import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/integrations/supabase/config";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate, configured]);

  if (configured && (loading || !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-base text-text-primary">
      {!collapsed && <Sidebar onCollapse={() => setCollapsed(true)} />}
      <main className="flex-1 min-w-0 overflow-x-hidden relative">
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="fixed top-3 left-3 z-40 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-subtle bg-surface text-[12px] text-text-secondary hover:text-text-primary hover:bg-hover shadow-sm"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        )}
        <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

