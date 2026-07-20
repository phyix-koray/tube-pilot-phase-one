import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  Sparkles,
  Boxes,
  Play,
  Settings as SettingsIcon,
  Zap,
  PanelLeftClose,
  LogOut,
} from "lucide-react";
import { mockUser, mockWorkflows } from "@/mock/data";
import { cn } from "@/lib/tp";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth, signOut } from "@/hooks/use-auth";


const groups = [
  {
    label: "AUTOMATE",
    items: [
      { to: "/agents", label: "Agents", icon: Bot },
      { to: "/skills", label: "Skills", icon: Sparkles },
    ],
  },
  {
    label: "DISTRIBUTE",
    items: [
      { to: "/channels", label: "Channels", icon: Boxes },
      { to: "/videos", label: "Videos", icon: Play },
    ],
  },
  {
    label: "SYSTEM",
    items: [{ to: "/settings", label: "Settings", icon: SettingsIcon }],
  },
] as const;

export function Sidebar({ onCollapse }: { onCollapse?: () => void } = {}) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const { user } = useAuth();
  const anyRunning = mockWorkflows.some((w) => w.status === "running");
  const { credits, plan } = mockUser;
  const pct = Math.round((credits.used / credits.total) * 100);

  const barColor =
    pct >= 95
      ? "bg-red"
      : pct >= 80
        ? "bg-amber"
        : "bg-green";

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-subtle bg-surface">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-subtle">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            anyRunning ? "bg-green pulse-dot" : "bg-text-tertiary",
          )}
        />
        <span className="text-[15px] font-semibold text-text-primary flex-1">
          TubePilot
        </span>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-3 text-[11px] font-medium tracking-wider text-text-tertiary mb-2">
              {g.label}
            </div>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active =
                  pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors relative",
                        active
                          ? "bg-raised text-text-primary"
                          : "text-text-secondary hover:bg-hover hover:text-text-primary",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-blue" />
                      )}
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {plan === "free" && (
          <div>
            <div className="px-3 text-[11px] font-medium tracking-wider text-text-tertiary mb-2">
              &nbsp;
            </div>
            <Link
              to="/settings"
              className="flex items-center gap-2.5 mx-1 px-3 py-2 rounded-md text-[13px] text-amber hover:bg-hover"
            >
              <Zap className="w-4 h-4" />
              Upgrade
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom: credits + user */}
      <div className="border-t border-subtle p-4 space-y-3">
        <Link to="/settings" className="block group">
          <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1.5">
            <span>Credits</span>
            <span className="font-mono">
              {credits.used.toLocaleString()} / {credits.total.toLocaleString()}
            </span>
          </div>
          <div className="h-1 bg-raised rounded-full overflow-hidden">
            <div
              className={cn("h-full", barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue/20 text-blue text-[11px] font-semibold flex items-center justify-center">
            {(user?.email ?? mockUser.avatarInitials).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-text-primary truncate">
              {user?.user_metadata?.full_name || user?.email || mockUser.name}
            </div>
          </div>
          <ThemeToggle compact />
          {user && (
            <button
              onClick={() => void signOut()}
              title="Sign out"
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

