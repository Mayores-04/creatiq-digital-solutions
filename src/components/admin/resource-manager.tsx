"use client";

import { type FormEvent, useState } from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  deleteCrmRecord,
  saveCrmRecord,
  type CrmResource,
} from "@/app/admin/actions";
import type { SelectOption } from "@/lib/crm/types";

type FieldType =
  | "text"
  | "email"
  | "textarea"
  | "select"
  | "date"
  | "number"
  | "checkbox"
  | "multi-select"
  | "image-upload";
type FieldValue = string | number | boolean | string[] | null | undefined;
type EditorMode = "panel" | "modal";

export type ResourceRow = { id: string; [key: string]: unknown };

export type ResourceField = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  defaultValue?: FieldValue;
  hint?: string;
  fullWidth?: boolean;
};

export type ResourceColumn = {
  key: string;
  label: string;
  kind?: "status" | "date" | "list" | "progress";
};

function asText(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  return String(value);
}

function valueForField(row: ResourceRow, field: ResourceField): FieldValue {
  const value = row[field.name];
  if (field.type === "checkbox") return Boolean(value);
  if (field.type === "multi-select") {
    return Array.isArray(value) ? value.map(String) : [];
  }
  if (field.type === "date" && typeof value === "string") {
    return value.slice(0, 10);
  }
  return typeof value === "number" ? value : value ? String(value) : "";
}

function emptyValues(fields: ResourceField[]) {
  return fields.reduce<Record<string, FieldValue>>((values, field) => {
    values[field.name] =
      field.defaultValue ??
      (field.type === "checkbox"
        ? false
        : field.type === "multi-select"
          ? []
          : "");
    return values;
  }, {});
}

function statusClass(value: unknown) {
  const status = String(value);
  if (["DONE", "COMPLETED", "CONVERTED", "WON"].includes(status)) {
    return "bg-emerald-400/10 text-emerald-300";
  }
  if (["ACTIVE", "IN_PROGRESS", "QUALIFIED", "REVIEW", "OPEN"].includes(status)) {
    return "bg-cyan-300/10 text-secondary";
  }
  if (["CLOSED", "ON_HOLD", "LOST"].includes(status)) {
    return "bg-amber-300/10 text-amber-200";
  }
  return "bg-primary/10 text-primary";
}

export function ResourceManager({
  resource,
  title,
  description,
  rows,
  fields,
  columns,
  canCreate = false,
  canDelete = false,
  emptyMessage = "No records yet.",
  editorMode = "panel",
  currentUserId,
  filterKeys,
}: {
  resource: CrmResource;
  title: string;
  description: string;
  rows: ResourceRow[];
  fields: ResourceField[];
  columns: ResourceColumn[];
  canCreate?: boolean;
  canDelete?: boolean;
  emptyMessage?: string;
  editorMode?: EditorMode;
  currentUserId?: string;
  filterKeys?: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ResourceRow | null>(null);
  const [form, setForm] = useState<Record<string, FieldValue>>(() =>
    emptyValues(fields),
  );
  const [busy, setBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const isCreating = selected === null;
  const formTitle = isCreating
    ? `New ${title.slice(0, -1)}`
    : `Edit ${title.slice(0, -1)}`;
  const mobileStatusColumn = columns.find((column) => column.kind === "status");
  const visibleRows =
    filter && filterKeys?.length
      ? rows.filter((row) =>
          filterKeys.some((key) =>
            asText(row[key]).toLowerCase().includes(filter.toLowerCase()),
          ),
        )
      : rows;

  function selectRow(row: ResourceRow) {
    setSelected(row);
    setEditorOpen(true);
    setForm(
      fields.reduce<Record<string, FieldValue>>((values, field) => {
        values[field.name] = valueForField(row, field);
        return values;
      }, {}),
    );
  }

  function newRecord() {
    setSelected(null);
    setForm(emptyValues(fields));
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setSelected(null);
    setForm(emptyValues(fields));
  }

  function setField(name: string, value: FieldValue) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let values = form;

    if (resource === "employees" && selected) {
      const isDeactivating = form.is_active === false;

      if (isDeactivating && selected.id === currentUserId) {
        toast.error("You cannot deactivate your own account", {
          description: "Ask another Admin to change your access if needed.",
        });
        return;
      }

      if (isDeactivating && selected.role === "ADMIN") {
        const confirmed = window.confirm(
          `Deactivate co-admin ${asText(selected.full_name)}? They will lose CRM access until another Admin reactivates them.`,
        );
        if (!confirmed) return;
        values = { ...form, confirm_co_admin_inactivation: true };
      }
    }

    setBusy(true);
    const result = await saveCrmRecord({
      resource,
      id: selected?.id,
      values,
    });
    setBusy(false);

    if (!result.ok) {
      toast.error("Couldn’t save", { description: result.error });
      return;
    }

    toast.success(result.message);
    router.refresh();

    if (editorMode === "modal") closeEditor();
    else if (isCreating) newRecord();
  }

  async function remove() {
    if (
      !selected ||
      !canDelete ||
      !window.confirm("Delete this record? This cannot be undone.")
    ) {
      return;
    }

    setBusy(true);
    const result = await deleteCrmRecord(
      resource as Exclude<CrmResource, "inquiries" | "employees">,
      selected.id,
    );
    setBusy(false);

    if (!result.ok) {
      toast.error("Couldn’t delete", { description: result.error });
      return;
    }

    toast.success(result.message);
    closeEditor();
    router.refresh();
  }

  const editorForm = (
    <form
      onSubmit={submit}
      className={`${editorMode === "modal" ? "w-full overflow-hidden" : "h-fit"} rounded-2xl border border-cyan-300/20 bg-surface shadow-[0_0_34px_rgba(8,189,255,0.06)]`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-cyan-300/10 bg-surface/95 p-4 backdrop-blur sm:p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
            {isCreating ? "Create record" : "Update record"}
          </p>
          <h2 className="mt-1 text-lg font-black text-primary">{formTitle}</h2>
          {editorMode === "modal" ? (
            <p className="mt-1 text-xs text-muted">
              Details are grouped in two columns for faster editing.
            </p>
          ) : null}
        </div>

        {(!isCreating || editorMode === "modal") && (
          <button
            type="button"
            onClick={closeEditor}
            className="rounded-lg p-2 text-muted hover:bg-cyan-300/10 hover:text-secondary"
            aria-label="Close editor"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div
        className={
          editorMode === "modal"
            ? "grid gap-4 p-4 sm:p-5 md:grid-cols-2"
            : "space-y-3 p-4 sm:p-5"
        }
      >
        {fields.map((field) => (
          <div
            key={field.name}
            className={
              field.fullWidth ||
              ["textarea", "image-upload", "multi-select"].includes(
                field.type ?? "",
              )
                ? "md:col-span-2"
                : ""
            }
          >
            <Field
              field={field}
              value={form[field.name]}
              onChange={(value) => setField(field.name, value)}
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 z-10 flex gap-2 border-t border-cyan-300/10 bg-surface/95 p-4 backdrop-blur sm:p-5">
        <button
          disabled={busy}
          className="primary-btn inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-60"
        >
          <Save size={15} />
          {busy ? "Saving..." : "Save"}
        </button>

        {canDelete && !isCreating ? (
          <button
            disabled={busy}
            onClick={remove}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-300/30 text-red-200 transition hover:bg-red-300/10 disabled:opacity-60"
            aria-label="Delete record"
          >
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
    </form>
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            CRM workspace
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {filterKeys?.length ? (
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={`Filter ${title.toLowerCase()}...`}
              className="h-11 rounded-xl border border-cyan-300/15 bg-surface/60 px-3 text-sm text-primary outline-none focus:border-secondary"
            />
          ) : null}

          {canCreate ? (
            <button
              type="button"
              onClick={newRecord}
              className="primary-btn inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-widest text-white"
            >
              <Plus size={16} /> Add {title.slice(0, -1)}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={
          editorMode === "modal"
            ? ""
            : "grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"
        }
      >
        <div className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          {visibleRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              {emptyMessage}
            </div>
          ) : (
            <>
              <div className="max-h-[34rem] divide-y divide-cyan-300/10 overflow-y-auto md:hidden">
                {visibleRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => selectRow(row)}
                    className={`block w-full p-4 text-left transition ${
                      selected?.id === row.id
                        ? "bg-cyan-300/10"
                        : "hover:bg-cyan-300/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-primary">
                        {asText(row[columns[0]?.key])}
                      </p>
                      {mobileStatusColumn ? (
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(row[mobileStatusColumn.key])}`}
                        >
                          {asText(row[mobileStatusColumn.key]).replaceAll(
                            "_",
                            " ",
                          )}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted">
                      {columns
                        .slice(1, 4)
                        .filter((column) => column.kind !== "status")
                        .map((column) => (
                          <div key={column.key} className="space-y-1">
                            <span className="text-primary/75">
                              {column.label}:{" "}
                            </span>
                            {formatCell(row[column.key], column.kind)}
                          </div>
                        ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="hidden max-h-[34rem] overflow-auto md:block">
                <table className="w-full min-w-[54rem] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-cyan-300/10 bg-background/95 text-[10px] font-bold uppercase tracking-widest text-secondary backdrop-blur">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className="px-4 py-3 font-inherit"
                        >
                          {column.label}
                        </th>
                      ))}
                      <th className="px-4 py-3" aria-label="Edit" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-300/10">
                    {visibleRows.map((row) => (
                      <tr
                        key={row.id}
                        className={
                          selected?.id === row.id
                            ? "bg-cyan-300/10"
                            : "hover:bg-cyan-300/5"
                        }
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className="max-w-72 px-4 py-3 align-top text-muted"
                          >
                            {column.kind === "status" ? (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(row[column.key])}`}
                              >
                                {asText(row[column.key]).replaceAll("_", " ")}
                              </span>
                            ) : (
                              formatCell(row[column.key], column.kind)
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => selectRow(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition hover:bg-cyan-300/10"
                            aria-label={`Edit ${asText(row[columns[0]?.key])}`}
                          >
                            <Pencil size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {editorMode === "panel" && editorForm}
      </div>

      {editorMode === "modal" && editorOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={formTitle}
        >
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-2xl sm:max-h-[calc(100dvh-3rem)]">
            {editorForm}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatCell(value: unknown, kind: ResourceColumn["kind"]) {
  if (kind === "progress") {
    return (
      <div className="min-w-28">
        <div className="flex justify-between text-xs">
          <span>{asText(value)}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-secondary"
            style={{
              width: `${Math.max(0, Math.min(100, Number(value) || 0))}%`,
            }}
          />
        </div>
      </div>
    );
  }

  if (kind === "date" && value) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(String(value)));
  }

  if (kind === "list" && Array.isArray(value)) {
    return (
      <div className="flex max-w-sm flex-wrap gap-1.5">
        {value.length ? (
          value.map((item) => (
            <span
              key={String(item)}
              className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2 py-1 text-[10px] font-bold text-secondary"
            >
              {String(item)}
            </span>
          ))
        ) : (
          <span>—</span>
        )}
      </div>
    );
  }

  return <span className="line-clamp-2">{asText(value)}</span>;
}

function Field({
  field,
  value,
  onChange,
}: {
  field: ResourceField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}) {
  const id = `field-${field.name}`;
  const baseClass =
    "mt-1.5 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary";

  if (field.type === "checkbox") {
    return (
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-cyan-300/15 bg-background/40 p-3">
        <span>
          <span className="block text-xs font-bold text-primary">
            {field.label}
          </span>
          {field.hint ? (
            <span className="mt-0.5 block text-[11px] text-muted">
              {field.hint}
            </span>
          ) : null}
        </span>
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
            value
              ? "border-secondary bg-secondary text-background"
              : "border-cyan-300/30"
          }`}
        >
          <input
            id={id}
            className="sr-only"
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          {value ? <Check size={13} /> : null}
        </span>
      </label>
    );
  }

  if (field.type === "image-upload") {
    return (
      <ImageUploadField
        id={id}
        field={field}
        value={String(value ?? "")}
        onChange={onChange}
        baseClass={baseClass}
      />
    );
  }

  if (field.type === "multi-select") {
    return (
      <MultiSelectField
        id={id}
        field={field}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  return (
    <label className="block">
      <FieldLabel field={field} />
      {field.type === "textarea" ? (
        <textarea
          id={id}
          required={field.required}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className={`${baseClass} min-h-24 resize-y`}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          required={field.required}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        >
          {!field.required ? <option value="">Not set</option> : null}
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          required={field.required}
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : field.type === "email"
                  ? "email"
                  : "text"
          }
          value={String(value ?? "")}
          onChange={(event) =>
            onChange(
              field.type === "number"
                ? Number(event.target.value)
                : event.target.value,
            )
          }
          placeholder={field.placeholder}
          className={baseClass}
        />
      )}
      <FieldHint field={field} />
    </label>
  );
}

function FieldLabel({ field }: { field: ResourceField }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
      {field.label}
      {field.required ? <span className="ml-1 text-red-300">*</span> : null}
    </span>
  );
}

function FieldHint({ field }: { field: ResourceField }) {
  if (!field.hint) return null;
  return (
    <span className="mt-1 block text-[11px] leading-4 text-muted">
      {field.hint}
    </span>
  );
}

function MultiSelectField({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: ResourceField;
  value: string[];
  onChange: (value: FieldValue) => void;
}) {
  const selected = new Set(value);

  function toggle(optionValue: string) {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    onChange(Array.from(next));
  }

  return (
    <fieldset id={id} className="block">
      <FieldLabel field={field} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {field.options?.map((option) => {
          const active = selected.has(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              aria-pressed={active}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                active
                  ? "border-secondary bg-cyan-300/12 text-primary shadow-[0_0_24px_rgba(8,189,255,0.08)]"
                  : "border-cyan-300/15 bg-background/40 text-muted hover:border-cyan-300/35 hover:text-primary"
              }`}
            >
              <span className="font-semibold">{option.label}</span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  active
                    ? "border-secondary bg-secondary text-background"
                    : "border-cyan-300/25"
                }`}
              >
                {active ? <Check size={12} /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <FieldHint field={field} />
    </fieldset>
  );
}

function ImageUploadField({
  id,
  field,
  value,
  onChange,
  baseClass,
}: {
  id: string;
  field: ResourceField;
  value: string;
  onChange: (value: FieldValue) => void;
  baseClass: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("purpose", "project");

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Unable to upload image.");
      }
      onChange(result.url);
      toast.success("Image uploaded to Cloudinary.");
    } catch (error) {
      toast.error("Couldn’t upload image", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="block">
      <FieldLabel field={field} />
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder ?? "Paste a Cloudinary URL or upload below"}
        className={baseClass}
      />
      <span className="mt-2 flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(event) =>
            event.target.files?.[0] && upload(event.target.files[0])
          }
          className="block max-w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-secondary hover:file:bg-cyan-300/20"
        />
        {uploading ? (
          <span className="text-xs text-secondary">Uploading...</span>
        ) : null}
      </span>
      <FieldHint field={field} />
    </label>
  );
}
