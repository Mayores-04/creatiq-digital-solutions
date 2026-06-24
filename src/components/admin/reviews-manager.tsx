"use client";

import { FormEvent, useState } from "react";
import { Check, Copy, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createReviewRequest, reviewCustomerReview } from "@/app/admin/actions";
import type { ClientRecord, CustomerReviewRecord, ProjectRecord } from "@/lib/crm/types";

export function ReviewsManager({ reviews, projects, clients }: { reviews: CustomerReviewRecord[]; projects: ProjectRecord[]; clients: ClientRecord[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function requestReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const result = await createReviewRequest({ projectId: String(data.get("projectId") ?? "") || undefined, clientId: String(data.get("clientId") ?? "") || undefined, recipientName: String(data.get("recipientName") ?? ""), recipientEmail: String(data.get("recipientEmail") ?? "") });
    setBusy(false);
    if (!result.ok || !result.token) { toast.error("Couldn’t create review link", { description: result.ok ? "No review token was returned." : result.error }); return; }
    const link = `${window.location.origin}/review/${result.token}`;
    await navigator.clipboard?.writeText(link).catch(() => undefined);
    toast.success("Private review link created", { description: "The link was copied to your clipboard." });
    event.currentTarget.reset();
    router.refresh();
  }

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    const result = await reviewCustomerReview(id, status);
    if (!result.ok) toast.error("Couldn’t review feedback", { description: result.error });
    else { toast.success(result.message); router.refresh(); }
  }

  return <section className="space-y-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Client feedback</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">Customer reviews</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Create a private, expiring review link for a client. Submissions remain pending until an Admin approves them for the public website.</p></div><div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]"><form onSubmit={requestReview} className="h-fit rounded-2xl border border-cyan-300/15 bg-surface/60 p-5"><div className="flex items-center gap-2"><Link2 size={17} className="text-secondary" /><h2 className="font-black text-primary">Create private review link</h2></div><div className="mt-5 space-y-3"><Field label="Client name" name="recipientName" /><Field label="Client email" name="recipientEmail" type="email" required /><Select label="Project (optional)" name="projectId" options={projects.map((project) => ({ value: project.id, label: project.name }))} /><Select label="CRM client (optional)" name="clientId" options={clients.map((client) => ({ value: client.id, label: client.company_name }))} /></div><button disabled={busy} className="primary-btn mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"><Copy size={15} />{busy ? "Creating..." : "Create & copy link"}</button></form><div className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60"><div className="border-b border-cyan-300/10 px-5 py-4"><h2 className="font-black text-primary">Review queue</h2></div><div className="max-h-[38rem] divide-y divide-cyan-300/10 overflow-y-auto">{reviews.length ? reviews.map((review) => <article key={review.id} className="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-primary">{review.customer_name || review.recipient_name || review.recipient_email || "Review request"}</p><p className="mt-1 text-xs text-muted">{review.customer_email || review.recipient_email || "Awaiting recipient"}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${review.status === "APPROVED" ? "bg-emerald-400/10 text-emerald-300" : review.status === "REJECTED" ? "bg-red-300/10 text-red-200" : review.status === "PENDING" ? "bg-cyan-300/10 text-secondary" : "bg-primary/10 text-primary"}`}>{review.status}</span></div>{review.rating && <p className="mt-3 text-sm font-bold text-amber-200">{review.rating} / 5</p>}{review.testimonial && <p className="mt-2 text-sm leading-6 text-muted">“{review.testimonial}”</p>}{review.status === "PENDING" && <div className="mt-4 flex gap-2"><button onClick={() => decide(review.id, "APPROVED")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 text-xs font-bold text-emerald-200 hover:bg-emerald-400/15"><Check size={14} />Approve & publish</button><button onClick={() => decide(review.id, "REJECTED")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-300/10 px-3 text-xs font-bold text-red-200 hover:bg-red-300/15"><X size={14} />Reject</button></div>}</article>) : <p className="p-10 text-center text-sm text-muted">No review requests yet.</p>}</div></div></div></section>;
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) { return <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</span><input name={name} type={type} required={required} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" /></label>; }
function Select({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) { return <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</span><select name={name} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary"><option value="">Not linked</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
