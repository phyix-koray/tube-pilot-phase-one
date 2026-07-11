import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-base text-text-primary">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
