"use client";

import { ChangeEvent, useState } from "react";
import { Download, FileUp, FolderLock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ProjectDocumentRecord, ProjectRecord } from "@/lib/crm/types";

export function ProjectDocuments({ projects, documents }: { projects: ProjectRecord[]; documents: ProjectDocumentRecord[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const activeDocuments = documents.filter((document) => document.project_id === projectId);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("Document is too large", { description: "The maximum file size is 50 MB." }); return; }
    setUploading(true);
    try {
      const signResponse = await fetch("/api/admin/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sign", projectId, fileName: file.name, contentType: file.type || "application/octet-stream" }) });
      const sign = await signResponse.json() as { signedUrl?: string; path?: string; error?: string };
      if (!signResponse.ok || !sign.signedUrl || !sign.path) throw new Error(sign.error ?? "Unable to authorize upload.");
      const storageResponse = await fetch(sign.signedUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" }, body: file });
      if (!storageResponse.ok) throw new Error("The file could not be uploaded to secure storage.");
      const completeResponse = await fetch("/api/admin/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", projectId, path: sign.path, fileName: file.name, mimeType: file.type || null, byteSize: file.size }) });
      const complete = await completeResponse.json() as { error?: string };
      if (!completeResponse.ok) throw new Error(complete.error ?? "Unable to save document metadata.");
      toast.success("Private project document uploaded.");
      router.refresh();
    } catch (error) { toast.error("Couldn’t upload document", { description: error instanceof Error ? error.message : "Try again." }); }
    finally { setUploading(false); event.target.value = ""; }
  }

  async function download(id: string) {
    setDownloading(id);
    try {
      const response = await fetch(`/api/admin/documents?id=${encodeURIComponent(id)}`);
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Unable to create secure link.");
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) { toast.error("Couldn’t open document", { description: error instanceof Error ? error.message : "Try again." }); }
    finally { setDownloading(null); }
  }

  return <section className="rounded-2xl border border-cyan-300/15 bg-surface/50 p-4 sm:p-5"><div className="flex items-start gap-3"><span className="rounded-xl bg-cyan-300/10 p-2 text-secondary"><FolderLock size={17} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Private workspace</p><h2 className="text-lg font-black text-primary">Project documents</h2><p className="mt-1 text-xs leading-5 text-muted">Files use a time-limited, signed upload and remain private to assigned project members.</p></div></div>{projects.length ? <><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-4 h-10 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary">{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-300/35 px-3 py-3 text-xs font-bold text-secondary transition hover:bg-cyan-300/10"><FileUp size={16} />{uploading ? "Uploading securely..." : "Upload private document"}<input className="sr-only" type="file" disabled={uploading} onChange={upload} /></label><div className="mt-4 divide-y divide-cyan-300/10">{activeDocuments.length ? activeDocuments.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{document.file_name}</p><p className="mt-1 text-[11px] text-muted">{document.byte_size ? `${Math.ceil(document.byte_size / 1024)} KB` : "Private file"}</p></div><button disabled={downloading === document.id} onClick={() => download(document.id)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-secondary hover:bg-cyan-300/10" aria-label={`Open ${document.file_name}`}><Download size={15} /></button></div>) : <p className="py-4 text-center text-xs text-muted">No private files for this project yet.</p>}</div></> : <p className="mt-4 text-sm text-muted">Create and assign a project before adding private documents.</p>}</section>;
}
