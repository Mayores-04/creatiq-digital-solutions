"use client";

import { Check } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import type { PublicService } from "@/lib/crm/public-data";
import { getServiceIcon } from "./service-icons";

const inputClass =
  "h-12 w-full rounded-2xl border border-cyan-300/15 bg-background/70 px-4 text-sm text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary focus:bg-background focus:shadow-[0_0_0_4px_rgba(8,189,255,0.08)]";

type SubmissionState = "idle" | "sending" | "sent" | "error";

export function InquiryForm({ services }: { services: PublicService[] }) {
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  function toggleService(service: string) {
    setSelectedServices((selected) =>
      selected.includes(service)
        ? selected.filter((item) => item !== service)
        : [...selected, service],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (selectedServices.length === 0) {
      const errorMessage = "Select at least one service to continue.";
      setState("error");
      setMessage(errorMessage);
      toast.error("Choose a service", { description: errorMessage });
      return;
    }

    setState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(formData),
          services: selectedServices,
        }),
      });
      const result = (await response.json()) as { error?: string; ok?: boolean };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to send your inquiry.");
      }

      form.reset();
      setSelectedServices([]);
      setState("sent");
      setMessage("Thanks! Your inquiry has been sent. We’ll reply as soon as possible.");
      toast.success("Inquiry sent", {
        description: "Creatiq received your message. Check your inbox for a confirmation.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to send your inquiry. Please try again.";

      setState("error");
      setMessage(errorMessage);
      toast.error("Inquiry not sent", { description: errorMessage });
    }
  }

  return (
    <div className="bg-[#07152d]/80 p-5 sm:p-6 lg:p-7 xl:p-8">
      <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your Name">
            <input type="text" name="name" autoComplete="name" placeholder="John Doe" className={inputClass} required minLength={2} maxLength={100} />
          </Field>
          <Field label="Email Address">
            <input type="email" name="email" autoComplete="email" placeholder="john@example.com" className={inputClass} required maxLength={254} />
          </Field>
        </div>
        <fieldset className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(8,189,255,0.08),rgba(2,11,31,0.3)_58%,rgba(3,86,231,0.06))] p-3">
          <legend className="sr-only">Services needed</legend>
          <div className="absolute -right-16 -top-16 h-28 w-28 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                Services Needed
              </p>
              <span className="rounded-full border border-cyan-300/20 bg-background/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-secondary" aria-live="polite">
                {selectedServices.length} selected
              </span>
            </div>

            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {services.map((service) => {
                const Icon = getServiceIcon(service.icon_name);
                const isSelected = selectedServices.includes(service.title);

                return (
                  <label key={service.title} className="group cursor-pointer">
                    <input
                      type="checkbox"
                      name="services"
                      value={service.title}
                      checked={isSelected}
                      onChange={() => toggleService(service.title)}
                      className="peer sr-only"
                    />
                    <span className={`flex min-h-10 items-center gap-2 rounded-xl border p-2 transition duration-200 hover:border-cyan-300/45 hover:bg-cyan-300/10 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300/50 ${isSelected ? "border-secondary/70 bg-cyan-300/15 shadow-[0_0_18px_rgba(8,189,255,0.1)]" : "border-cyan-300/15 bg-background/50"}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${isSelected ? "bg-secondary text-background" : "bg-cyan-300/10 text-secondary"}`}>
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold leading-tight text-primary">
                          {service.title}
                        </span>
                      </span>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${isSelected ? "border-secondary bg-secondary text-background" : "border-cyan-300/25 text-transparent"}`}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </fieldset>
        <Field label="Project Description">
          <textarea name="description" placeholder="Tell us about your project..." className="min-h-28 w-full resize-y rounded-2xl border border-cyan-300/15 bg-background/70 px-4 py-3 text-sm text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary focus:bg-background focus:shadow-[0_0_0_4px_rgba(8,189,255,0.08)]" required minLength={10} maxLength={5000} />
        </Field>
        <input name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
        <button type="submit" disabled={state === "sending"} className="primary-btn flex h-14 w-full items-center justify-center rounded-2xl text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_0_30px_rgba(8,189,255,0.18)] disabled:cursor-not-allowed disabled:opacity-70">
          {state === "sending" ? "Sending Inquiry..." : "Send Inquiry"}
        </button>
        <p className={`min-h-6 text-center text-xs leading-6 ${state === "error" ? "text-red-300" : state === "sent" ? "text-cyan-200" : "text-muted/70"}`} aria-live="polite">
          {message || "We’ll review your inquiry and reply as soon as possible."}
        </p>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{label}</span>
      {children}
    </label>
  );
}
