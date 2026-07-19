import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
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
