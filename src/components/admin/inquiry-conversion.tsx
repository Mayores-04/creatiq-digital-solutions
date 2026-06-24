"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { convertInquiry } from "@/app/admin/actions";
import type { InquiryRecord } from "@/lib/crm/types";

export function InquiryConversion({ inquiries }: { inquiries: InquiryRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const convertible = inquiries.filter((inquiry) => !inquiry.project_id && inquiry.status !== "CLOSED");
  if (!convertible.length) return null;

  async function convert(id: string) {
    if (!window.confirm("Create a client and lead project from this inquiry?")) return;
    setBusyId(id);
    const result = await convertInquiry(id);
    setBusyId(null);
    if (!result.ok) toast.error("Couldn’t convert inquiry", { description: result.error });
    else { toast.success(result.message); router.refresh(); }
  }

  return <section className="rounded-2xl border border-cyan-300/15 bg-surface/50 p-4 sm:p-5"><div className="flex items-center gap-2"><ArrowRightLeft size={17} className="text-secondary" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Admin workflow</p><h2 className="text-lg font-black text-primary">Convert qualified leads</h2></div></div><p className="mt-2 text-sm leading-6 text-muted">Conversion creates a linked client and a Lead project, so nothing gets lost between sales and delivery.</p><div className="mt-4 flex flex-wrap gap-2">{convertible.slice(0, 8).map((inquiry) => <button key={inquiry.id} disabled={busyId === inquiry.id} onClick={() => convert(inquiry.id)} className="rounded-xl border border-cyan-300/20 bg-background/30 px-3 py-2 text-left text-xs transition hover:border-secondary disabled:opacity-60"><span className="block font-bold text-primary">{busyId === inquiry.id ? "Converting..." : inquiry.name}</span><span className="mt-0.5 block text-muted">{inquiry.status.replaceAll("_", " ")}</span></button>)}</div></section>;
}
