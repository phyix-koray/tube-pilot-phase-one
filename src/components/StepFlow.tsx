import { Check } from "lucide-react";
import { cn } from "@/lib/tp";

export interface Step {
  key: string;
  title: string;
}

export function StepBar({
  steps,
  current,
  accent,
  onJump,
}: {
  steps: Step[];
  current: number;
  accent?: string;
  onJump?: (i: number) => void;
}) {
  const color = accent ?? "var(--tp-blue)";
  return (
    <div className="space-y-2">
      <ol className="flex items-center gap-1.5">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "current" : "upcoming";
          const clickable = onJump && i <= current;
          return (
            <li key={s.key} className="flex items-center gap-1.5 flex-1 min-w-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(i)}
                title={s.title}
                className={cn(
                  "flex items-center shrink-0",
                  clickable && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                    state === "upcoming" && "bg-raised text-text-tertiary",
                  )}
                  style={
                    state !== "upcoming"
                      ? { backgroundColor: color, color: "#0a0a0b" }
                      : undefined
                  }
                >
                  {state === "done" ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span
                  className="h-px flex-1 min-w-2"
                  style={{
                    backgroundColor: i < current ? color : "var(--tp-subtle)",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-text-primary truncate">
          Step {current + 1} — {steps[current]?.title}
        </span>
        <span className="text-text-tertiary shrink-0 ml-2">
          {current + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}
