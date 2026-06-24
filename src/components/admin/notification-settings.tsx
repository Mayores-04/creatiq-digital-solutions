"use client";

import { useEffect, useState } from "react";

import { BellRing, Mail, ShieldCheck } from "lucide-react";

type SettingKey = "crm" | "email" | "security";

const storageKey = "creatiq-notification-settings";

const options: {
  key: SettingKey;
  title: string;
  detail: string;
  icon: typeof BellRing;
}[] = [
  {
    key: "crm",
    title: "CRM activity alerts",
    detail:
      "Show recent project, inquiry, task, and profile changes in the activity center.",
    icon: BellRing,
  },
  {
    key: "email",
    title: "Email summaries",
    detail:
      "Keep this ready for future email digests and important account alerts.",
    icon: Mail,
  },
  {
    key: "security",
    title: "Access & security alerts",
    detail: "Prioritize account role, activation, and login-related changes.",
    icon: ShieldCheck,
  },
];

export function NotificationSettings() {
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>({
    crm: true,
    email: false,
    security: true,
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);

      if (!saved) return;

      const parsed = JSON.parse(saved) as Partial<Record<SettingKey, boolean>>;

      setSettings((current) => ({
        ...current,
        ...parsed,
      }));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  function toggle(key: SettingKey) {
    setSettings((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      };

      window.localStorage.setItem(storageKey, JSON.stringify(next));

      return next;
    });
  }

  return (
    <aside
      id="notification-settings"
      className="h-fit overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60"
    >
      <div className="border-b border-cyan-300/10 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
          Configuration
        </p>

        <h2 className="mt-2 text-xl font-black text-primary">
          Notification settings
        </h2>

        <p className="mt-2 text-xs leading-5 text-muted">
          Control what this browser highlights in the activity center.
          Server-level notification rules can be added later.
        </p>
      </div>

      <div className="custom-scrollbar max-h-[calc(100dvh-20rem)] overflow-y-auto p-5">
        <div className="space-y-3">
          {options.map(({ key, title, detail, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className="flex w-full items-start justify-between gap-3 rounded-2xl border border-cyan-300/10 bg-background/35 p-3 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]"
            >
              <span className="flex gap-3">
                <span className="mt-0.5 rounded-xl bg-cyan-300/10 p-2 text-secondary">
                  <Icon size={16} />
                </span>

                <span>
                  <span className="block text-sm font-bold text-primary">
                    {title}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-muted">
                    {detail}
                  </span>
                </span>
              </span>

              <span
                className={`mt-1 h-5 w-9 shrink-0 rounded-full p-0.5 transition ${
                  settings[key] ? "bg-secondary" : "bg-primary/15"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition ${
                    settings[key] ? "translate-x-4" : ""
                  }`}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
