import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        compact
          ? "inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover transition-colors"
          : "inline-flex items-center gap-2 px-3 h-9 rounded-md bg-raised hover:bg-hover text-[13px] text-text-primary"
      }
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
