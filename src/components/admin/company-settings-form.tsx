"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateCompanySettings } from "@/app/admin/actions";
import type { CompanySettingsRecord } from "@/lib/crm/types";

export function CompanySettingsForm({ settings }: { settings: CompanySettingsRecord | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url ?? "");
  const [faviconUrl, setFaviconUrl] = useState(settings?.favicon_url ?? "");
  const social = settings?.social_links ?? {};

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const result = await updateCompanySettings(Object.fromEntries(form.entries()));
    setBusy(false);
    if (!result.ok) toast.error("Couldn’t publish settings", { description: result.error });
    else { toast.success(result.message); router.refresh(); }
  }

  return <section className="max-w-4xl"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Public website</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">Company settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">These are the public business details rendered across the marketing website. Upload public brand media directly to Cloudinary.</p><form onSubmit={submit} className="mt-6 grid gap-5 rounded-2xl border border-cyan-300/15 bg-surface/60 p-5 sm:grid-cols-2 sm:p-7"><Input label="Company name" name="company_name" defaultValue={settings?.company_name} required /><Input label="Public email" name="company_email" type="email" defaultValue={settings?.company_email} required /><Input label="Location" name="location" defaultValue={settings?.location ?? ""} /><div><Input label="Landscape logo URL" name="logo_url" value={logoUrl} onChange={setLogoUrl} hint="Cloudinary URL or a local public image path." /><CompanyImageUpload onUploaded={setLogoUrl} /></div><div><Input label="Favicon / icon URL" name="favicon_url" value={faviconUrl} onChange={setFaviconUrl} /><CompanyImageUpload onUploaded={setFaviconUrl} /></div><div className="sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Social links</p><div className="mt-2 grid gap-3 sm:grid-cols-3"><Input label="Facebook" name="facebook" defaultValue={social.facebook ?? ""} /><Input label="Instagram" name="instagram" defaultValue={social.instagram ?? ""} /><Input label="LinkedIn" name="linkedin" defaultValue={social.linkedin ?? ""} /></div></div><div className="sm:col-span-2 flex justify-end"><button disabled={busy} className="primary-btn inline-flex h-11 items-center gap-2 rounded-xl px-5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"><Save size={16} />{busy ? "Publishing..." : "Publish settings"}</button></div></form></section>;
}

function Input({ label, name, defaultValue, value, onChange, type = "text", required, hint }: { label: string; name: string; defaultValue?: string | null; value?: string; onChange?: (value: string) => void; type?: string; required?: boolean; hint?: string }) {
  return <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}{required && <span className="ml-1 text-red-300">*</span>}</span><input required={required} name={name} type={type} {...(value !== undefined ? { value, onChange: (event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value) } : { defaultValue: defaultValue ?? "" })} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" />{hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}</label>;
}

function CompanyImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.set("file", file);
    data.set("purpose", "logo");
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: data });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Unable to upload image.");
      onUploaded(result.url);
      toast.success("Brand image uploaded to Cloudinary.");
    } catch (error) { toast.error("Couldn’t upload image", { description: error instanceof Error ? error.message : "Try again." }); }
    finally { setUploading(false); event.target.value = ""; }
  }
  return <div className="mt-2"><input type="file" accept="image/*" disabled={uploading} onChange={upload} className="block max-w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-secondary hover:file:bg-cyan-300/20" />{uploading && <p className="mt-1 text-xs text-secondary">Uploading...</p>}</div>;
}
