"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Globe2,
  ImageIcon,
  Mail,
  MapPin,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateCompanySettings } from "@/app/admin/actions";
import type { CompanySettingsRecord } from "@/lib/crm/types";

type SocialKey = "facebook" | "instagram" | "linkedin";

export function CompanySettingsForm({
  settings,
}: {
  settings: CompanySettingsRecord | null;
}) {
  const router = useRouter();

  const savedSocial = (settings?.social_links ?? {}) as Partial<
    Record<SocialKey, string>
  >;

  const [busy, setBusy] = useState(false);

  const [companyName, setCompanyName] = useState(
    settings?.company_name ?? "Creatiq Digital Solutions",
  );
  const [companyEmail, setCompanyEmail] = useState(
    settings?.company_email ?? "",
  );
  const [location, setLocation] = useState(settings?.location ?? "");
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url ?? "");
  const [faviconUrl, setFaviconUrl] = useState(settings?.favicon_url ?? "");
  const [socialLinks, setSocialLinks] = useState<Record<SocialKey, string>>({
    facebook: savedSocial.facebook ?? "",
    instagram: savedSocial.instagram ?? "",
    linkedin: savedSocial.linkedin ?? "",
  });

  const completionItems = useMemo(
    () => [
      { label: "Company name", done: Boolean(companyName.trim()) },
      { label: "Public email", done: Boolean(companyEmail.trim()) },
      { label: "Location", done: Boolean(location.trim()) },
      { label: "Landscape logo", done: Boolean(logoUrl.trim()) },
      { label: "Favicon / icon", done: Boolean(faviconUrl.trim()) },
      {
        label: "Social links",
        done: Object.values(socialLinks).some((value) => value.trim()),
      },
    ],
    [companyEmail, companyName, faviconUrl, location, logoUrl, socialLinks],
  );

  const completionCount = completionItems.filter((item) => item.done).length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const result = await updateCompanySettings(
      Object.fromEntries(form.entries()),
    );

    setBusy(false);

    if (!result.ok) {
      toast.error("Couldn’t publish settings", {
        description: result.error,
      });
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <section className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Public website
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">
            Company settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Manage your public business details, brand assets, and website
            identity from one workspace.
          </p>
        </div>

        <div className="w-fit rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Brand setup
          </p>
          <p className="mt-1 text-sm font-black text-primary">
            {completionCount} / {completionItems.length} completed
          </p>
        </div>
      </div>

      <div className="mt-6 grid w-full items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem_20rem] 2xl:grid-cols-[minmax(0,1fr)_26rem_22rem]">
        <form
          onSubmit={submit}
          className="grid h-fit auto-rows-max gap-4 rounded-2xl border border-cyan-300/15 bg-surface/60 p-5 sm:p-6"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Settings input
            </p>
            <h2 className="mt-2 text-xl font-black text-primary">
              Public details
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              These values are rendered across your public marketing website.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <Input
              label="Company name"
              name="company_name"
              value={companyName}
              onChange={setCompanyName}
              required
            />

            <Input
              label="Public email"
              name="company_email"
              type="email"
              value={companyEmail}
              onChange={setCompanyEmail}
              required
            />

            <Input
              label="Location"
              name="location"
              value={location}
              onChange={setLocation}
            />

            <div className="space-y-2">
              <Input
                label="Landscape logo URL"
                name="logo_url"
                value={logoUrl}
                onChange={setLogoUrl}
                hint="Cloudinary URL or a local public image path."
              />
              <CompanyImageUpload onUploaded={setLogoUrl} />
            </div>

            <div className="space-y-2">
              <Input
                label="Favicon / icon URL"
                name="favicon_url"
                value={faviconUrl}
                onChange={setFaviconUrl}
              />
              <CompanyImageUpload onUploaded={setFaviconUrl} />
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/10 bg-background/25 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Social links
            </p>

            <div className="mt-3 grid gap-3">
              <Input
                label="Facebook"
                name="facebook"
                value={socialLinks.facebook}
                onChange={(value) =>
                  setSocialLinks((current) => ({
                    ...current,
                    facebook: value,
                  }))
                }
              />

              <Input
                label="Instagram"
                name="instagram"
                value={socialLinks.instagram}
                onChange={(value) =>
                  setSocialLinks((current) => ({
                    ...current,
                    instagram: value,
                  }))
                }
              />

              <Input
                label="LinkedIn"
                name="linkedin"
                value={socialLinks.linkedin}
                onChange={(value) =>
                  setSocialLinks((current) => ({
                    ...current,
                    linkedin: value,
                  }))
                }
              />
            </div>
          </div>

          <button
            disabled={busy}
            className="primary-btn inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
          >
            <Save size={16} />
            {busy ? "Publishing..." : "Publish settings"}
          </button>
        </form>

        <aside className="h-fit xl:sticky xl:top-6">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60 p-5 shadow-[0_0_60px_rgba(8,189,255,0.08)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                    Live preview
                  </p>
                  <h2 className="mt-2 text-xl font-black text-primary">
                    Public brand card
                  </h2>
                </div>

                {/* <span className="rounded-xl border border-cyan-300/15 bg-cyan-300/10 p-2 text-secondary">
                  <Eye size={18} />
                </span> */}

                <span className="rounded-xl border border-cyan-300/15 bg-cyan-300/10 p-2 text-secondary">
                  <Sparkles size={18} />
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-300/15 bg-background/50">
                <div className="flex items-center gap-2 border-b border-cyan-300/10 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
                  <span className="ml-2 h-2 w-24 rounded-full bg-cyan-300/10" />
                </div>

                <div className="p-4">
                  <div className="flex min-h-24 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`${companyName} logo preview`}
                        className="max-h-16 max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <ImageIcon className="text-secondary" size={28} />
                        <p className="mt-2 text-xs font-bold text-muted">
                          Logo preview appears here
                        </p>
                      </div>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-primary">
                    {companyName || "Company name"}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-muted">
                    Your public website identity, contact details, and brand
                    assets are synced from this panel.
                  </p>

                  <div className="mt-5 space-y-3">
                    <PreviewInfo
                      icon={Mail}
                      label="Public email"
                      value={companyEmail || "No email set"}
                    />

                    <PreviewInfo
                      icon={MapPin}
                      label="Location"
                      value={location || "No location set"}
                    />

                    <PreviewInfo
                      icon={Globe2}
                      label="Social channels"
                      value={`${countSocialLinks(socialLinks)} active link${
                        countSocialLinks(socialLinks) === 1 ? "" : "s"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <aside className="h-fit xl:sticky xl:top-6">
          <div className="rounded-2xl border border-cyan-300/15 bg-surface/60 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Publish checklist
            </p>

            <h2 className="mt-2 text-xl font-black text-primary">
              Brand readiness
            </h2>

            <p className="mt-2 text-xs leading-5 text-muted">
              Check the details before publishing updates to the public website.
            </p>

            <div className="mt-5 space-y-3">
              {completionItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-cyan-300/10 bg-background/35 px-3 py-2.5"
                >
                  <span className="text-sm font-semibold text-muted">
                    {item.label}
                  </span>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      item.done
                        ? "bg-emerald-300/10 text-emerald-200"
                        : "bg-amber-300/10 text-amber-200"
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    {item.done ? "Ready" : "Missing"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
              <p className="text-xs font-bold text-primary">
                Publishing status
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Changes appear on the marketing website after publishing and
                refresh.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Input({
  label,
  name,
  defaultValue,
  value,
  onChange,
  type = "text",
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
        {label}
        {required && <span className="ml-1 text-red-300">*</span>}
      </span>

      <input
        required={required}
        name={name}
        type={type}
        {...(value !== undefined
          ? {
              value,
              onChange: (event: ChangeEvent<HTMLInputElement>) =>
                onChange?.(event.target.value),
            }
          : { defaultValue: defaultValue ?? "" })}
        className="mt-1.5 h-10 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-cyan-300/10"
      />

      {hint && (
        <span className="mt-1 block text-[11px] text-muted">{hint}</span>
      )}
    </label>
  );
}

function CompanyImageUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const data = new FormData();
    data.set("file", file);
    data.set("purpose", "logo");

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: data,
      });

      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Unable to upload image.");
      }

      onUploaded(result.url);
      toast.success("Brand image uploaded to Cloudinary.");
    } catch (error) {
      toast.error("Couldn’t upload image", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={upload}
        className="block max-w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-secondary hover:file:bg-cyan-300/20"
      />

      {uploading && <p className="mt-1 text-xs text-secondary">Uploading...</p>}
    </div>
  );
}

function PreviewInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-cyan-300/10 bg-background/35 p-3">
      <span className="mt-0.5 rounded-lg bg-cyan-300/10 p-2 text-secondary">
        <Icon size={14} />
      </span>

      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted">
          {label}
        </span>

        <span className="mt-1 block truncate text-sm font-semibold text-primary">
          {value}
        </span>
      </span>
    </div>
  );
}

function countSocialLinks(socialLinks: Record<SocialKey, string>) {
  return Object.values(socialLinks).filter((value) => value.trim()).length;
}
