"use client";

import { type FormEvent, useState } from "react";
import { Save, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { deleteAccessRole, saveAccessRole } from "@/app/admin/actions";
import { ADMIN_MODULES } from "@/lib/crm/constants";
import type { AccessRoleRecord } from "@/lib/crm/types";

export function ModuleAccessSettings({
  accessRoles,
}: {
  accessRoles: AccessRoleRecord[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editingRole, setEditingRole] = useState<AccessRoleRecord | null>(null);
  const [permissions, setPermissions] = useState<string[]>([
    "overview",
    "projects",
    "tasks",
    "notifications",
  ]);

  function edit(role: AccessRoleRecord) {
    setEditingRole(role);
    setPermissions(role.permissions);
  }

  function createNew() {
    setEditingRole(null);
    setPermissions(["overview", "projects", "tasks", "notifications"]);
  }

  function toggle(key: string) {
    setPermissions((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    const result = await saveAccessRole({
      id: editingRole?.id,
      name: String(values.get("name") ?? ""),
      description: String(values.get("description") ?? ""),
      permissions,
    });
    setBusy(false);

    if (!result.ok) {
      toast.error("Could not save module access profile", {
        description: result.error,
      });
      return;
    }

    toast.success(result.message);
    form.reset();
    setEditingRole(null);
    router.refresh();
  }

  async function remove(role: AccessRoleRecord) {
    if (role.is_system) {
      toast.error("System profiles cannot be deleted");
      return;
    }

    if (!window.confirm(`Delete ${role.name}?`)) return;
    setBusy(true);
    const result = await deleteAccessRole(role.id);
    setBusy(false);

    if (!result.ok) {
      toast.error("Could not delete module access profile", {
        description: result.error,
      });
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-cyan-300/15 bg-surface/60 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Configuration settings
          </p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-[-0.04em] text-primary">
            <Settings2 size={20} className="text-secondary" />
            Module Access Configuration
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Configure module-access profiles for Staff users. This is separate
            from Core Security Level, which controls Admin vs Staff power.
          </p>
        </div>
        <button
          type="button"
          onClick={createNew}
          className="h-10 rounded-xl border border-cyan-300/20 px-4 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:bg-cyan-300/10"
        >
          New profile
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <form onSubmit={submit} className="rounded-2xl border border-cyan-300/10 bg-background/35 p-4">
          <h3 className="font-black text-primary">
            {editingRole ? `Edit ${editingRole.name}` : "Create access profile"}
          </h3>
          <div className="mt-4 space-y-3">
            <Field label="Profile name" name="name" required defaultValue={editingRole?.name ?? ""} />
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                Description
              </span>
              <textarea
                name="description"
                defaultValue={editingRole?.description ?? ""}
                className="mt-1.5 min-h-20 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 py-2 text-sm text-primary outline-none focus:border-secondary"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {ADMIN_MODULES.map((module) => (
              <label
                key={module.key}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-cyan-300/10 bg-background/35 p-3 text-xs font-bold text-primary"
              >
                {module.label}
                <input
                  type="checkbox"
                  checked={permissions.includes(module.key)}
                  onChange={() => toggle(module.key)}
                  className="h-4 w-4 accent-cyan-300"
                />
              </label>
            ))}
          </div>

          <button
            disabled={busy}
            className="primary-btn mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
          >
            <Save size={15} />
            {busy ? "Saving..." : "Save profile"}
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-background/35">
          <div className="border-b border-cyan-300/10 px-4 py-3">
            <h3 className="font-black text-primary">Available profiles</h3>
          </div>
          <div className="max-h-[32rem] divide-y divide-cyan-300/10 overflow-y-auto">
            {accessRoles.map((role) => (
              <article key={role.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-primary">
                      {role.name}
                      {role.is_system ? (
                        <span className="ml-2 rounded-full bg-cyan-300/10 px-2 py-1 text-[9px] font-bold text-secondary">
                          SYSTEM
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {role.description || "No description yet."}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-muted">
                      {role.permissions.length
                        ? role.permissions.join(", ")
                        : "No modules selected"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => edit(role)}
                      className="rounded-lg border border-cyan-300/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-secondary hover:bg-cyan-300/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(role)}
                      className="rounded-lg border border-red-300/20 px-3 py-2 text-red-200 hover:bg-red-300/10"
                      aria-label={`Delete ${role.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
        {label}
      </span>
      <input
        required={required}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary"
      />
    </label>
  );
}
