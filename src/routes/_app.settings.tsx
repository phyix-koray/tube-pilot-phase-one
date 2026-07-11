import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Plus, Check } from "lucide-react";
import { mockUser } from "@/mock/data";
import { cn } from "@/lib/tp";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TubePilot" },
      { name: "description", content: "Account, keys, notifications and billing." },
    ],
  }),
  component: SettingsPage,
});

const tabs = ["General", "API Keys", "Notifications", "Billing"] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("General");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-text-secondary mt-1">
          Manage your account and integrations.
        </p>
      </div>

      <div className="flex gap-1 border-b border-subtle">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 h-9 text-[13px] -mb-px border-b-2 transition-colors",
              tab === t
                ? "border-blue text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "General" && <GeneralTab />}
      {tab === "API Keys" && <ApiKeysTab />}
      {tab === "Notifications" && <NotificationsTab />}
      {tab === "Billing" && <BillingTab />}
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="rounded-xl bg-surface border border-subtle p-6 max-w-2xl space-y-4">
      <Row label="Timezone">
        <select className="h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]">
          <option>Europe/Istanbul</option>
          <option>UTC</option>
          <option>America/New_York</option>
        </select>
      </Row>
      <Row label="Default visibility">
        <select className="h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]">
          <option>Public</option>
          <option>Unlisted</option>
          <option>Private</option>
        </select>
      </Row>
      <Row label="Default language">
        <select className="h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]">
          <option>English</option>
          <option>Türkçe</option>
        </select>
      </Row>
      <Row label="Theme">
        <select
          defaultValue="Dark"
          className="h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]"
        >
          <option>Dark</option>
        </select>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-[13px]">{label}</div>
      {children}
    </div>
  );
}

const apiKeys = [
  { service: "Anthropic", key: "sk-ant-••••1234", status: "active" },
  { service: "OpenAI", key: "sk-••••5678", status: "active" },
  { service: "fal.ai", key: "••••abcd", status: "active" },
  { service: "Gemini", key: null, status: "not_connected" },
  {
    service: "YouTube OAuth",
    key: "Connected as user@gmail.com",
    status: "active",
  },
];

function ApiKeysTab() {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  return (
    <div className="rounded-xl bg-surface border border-subtle overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-text-tertiary border-b border-subtle">
            <th className="p-3">Service</th>
            <th className="p-3">Key</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {apiKeys.map((k, i) => (
            <tr key={k.service} className="border-b border-subtle last:border-0">
              <td className="p-3 font-medium">{k.service}</td>
              <td className="p-3 font-mono text-text-secondary">
                {k.key ? (
                  <span className="flex items-center gap-2">
                    {revealed[i] ? "sk-ant-XXXXXXXXXX-real-key" : k.key}
                    {!k.key?.startsWith("Connected") && (
                      <button
                        onClick={() =>
                          setRevealed((r) => ({ ...r, [i]: !r[i] }))
                        }
                      >
                        {revealed[i] ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </span>
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </td>
              <td className="p-3">
                {k.status === "active" ? (
                  <span className="inline-flex items-center gap-1 text-green">
                    <Check className="w-3.5 h-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="text-text-tertiary">Not connected</span>
                )}
              </td>
              <td className="p-3 text-right">
                {k.status === "active" ? (
                  <span className="flex justify-end gap-2">
                    <button className="rounded-md bg-raised hover:bg-hover px-2.5 h-7 text-[12px]">
                      Rotate
                    </button>
                    <button className="rounded-md bg-raised hover:bg-hover px-2.5 h-7 text-[12px] text-red">
                      Remove
                    </button>
                  </span>
                ) : (
                  <button className="inline-flex items-center gap-1 rounded-md bg-blue hover:bg-blue/90 text-white px-2.5 h-7 text-[12px] font-medium">
                    <Plus className="w-3.5 h-3.5" />
                    Connect
                  </button>
                )}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} className="p-3">
              <button className="inline-flex items-center gap-1 text-[13px] text-blue">
                <Plus className="w-4 h-4" />
                Add API Key
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const notifRows = [
  "Workflow completed",
  "Workflow failed",
  "Video published",
  "Pending Review reminder",
  "Credits below 20%",
  "Credits below 5%",
];

function NotificationsTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(notifRows.map((r) => [r, true])),
  );
  return (
    <div className="rounded-xl bg-surface border border-subtle p-6 max-w-2xl space-y-4">
      {notifRows.map((r) => (
        <div key={r} className="flex items-center justify-between">
          <div className="text-[13px]">{r}</div>
          <button
            onClick={() => setEnabled((e) => ({ ...e, [r]: !e[r] }))}
            className={cn(
              "w-9 h-5 rounded-full p-0.5 flex transition-colors",
              enabled[r] ? "bg-blue" : "bg-subtle",
            )}
          >
            <span
              className={cn(
                "w-4 h-4 bg-white rounded-full transition-transform",
                enabled[r] ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
        </div>
      ))}
      <div className="pt-4 border-t border-subtle flex items-center justify-between">
        <div className="text-[13px]">Delivery method</div>
        <select className="h-9 rounded-md bg-raised border border-subtle px-2.5 text-[13px]">
          <option>In-app only</option>
          <option>Email only</option>
          <option>Both</option>
        </select>
      </div>
    </div>
  );
}

function BillingTab() {
  const { credits, plan } = mockUser;
  const pct = Math.round((credits.used / credits.total) * 100);
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface border border-subtle p-6 max-w-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[20px] font-semibold capitalize">{plan} Plan</div>
            <div className="text-[13px] text-text-secondary mt-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                Active
              </span>
              <span className="ml-3">Renews: Aug 7, 2026</span>
            </div>
          </div>
          <div className="text-[20px] font-mono">$29/mo</div>
        </div>

        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-2">
            Credits this month
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-raised rounded-full overflow-hidden">
              <div className="h-full bg-green" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[13px] font-mono text-text-secondary">
              {credits.used.toLocaleString()} / {credits.total.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-1.5 text-[13px]">
          <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">
            Breakdown
          </div>
          {[
            ["Suno generation", 340],
            ["GPT Image", 280],
            ["Video rendering", 127],
            ["YouTube uploads", 100],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-text-secondary">
              <span>{l}</span>
              <span className="font-mono">{v} credits</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button className="rounded-md bg-raised hover:bg-hover px-3 h-9 text-[13px]">
            Manage Plan
          </button>
          <button className="rounded-md bg-raised hover:bg-hover px-3 h-9 text-[13px]">
            View Invoices
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-surface border border-subtle overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-text-tertiary border-b border-subtle">
              <th className="p-3">Feature</th>
              <th className="p-3">Free</th>
              <th className="p-3">Pro</th>
              <th className="p-3">Studio</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Price", "$0", "$29/mo", "$99/mo"],
              ["Credits/month", "100", "2,000", "10,000"],
              ["YouTube channels", "1", "5", "Unlimited"],
              ["Workflows", "2", "Unlimited", "Unlimited"],
              ["Video editor", "Basic", "Full", "Full + Priority render"],
              ["Support", "Community", "Email", "Dedicated"],
            ].map((row) => (
              <tr key={row[0]} className="border-b border-subtle last:border-0">
                {row.map((cell, i) => (
                  <td
                    key={i}
                    className={cn("p-3", i === 0 ? "text-text-secondary" : "")}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
