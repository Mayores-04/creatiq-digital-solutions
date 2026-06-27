"use client";

import { type FormEvent, type RefObject, useMemo, useRef, useState } from "react";
import { Bold, CalendarDays, Hash, ImageIcon, Italic, List, ListOrdered, MessageSquareText, Pencil, Plus, Quote, Save, Sparkles, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteContentPlannerItem, saveContentPlannerItem } from "@/app/admin/actions";
import { CONTENT_STATUSES } from "@/lib/crm/constants";
import type { ContentPlannerItemRecord, ContentPlannerMediaAsset, ProfileRecord, ProjectRecord, ServiceRecord } from "@/lib/crm/types";

type SelectOption = { value: string; label: string };
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ContentPlanner({
  items,
  profiles,
  projects,
  services,
}: {
  items: ContentPlannerItemRecord[];
  profiles: ProfileRecord[];
  projects: ProjectRecord[];
  services: ServiceRecord[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ContentPlannerItemRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<ContentPlannerMediaAsset[]>([]);
  const [caption, setCaption] = useState("");
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const monthStart = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1);
  }, [selectedMonth, selectedYear]);
  const days = useMemo(() => buildMonthDays(monthStart), [monthStart]);
  const names = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(monthStart);
  const availableYears = useMemo(() => {
    const itemYears = items.flatMap((item) => {
      const year = Number(item.planned_for?.slice(0, 4));
      return Number.isInteger(year) ? [year] : [];
    });
    const currentYear = new Date().getFullYear();
    const min = Math.min(currentYear - 2, selectedYear, ...itemYears);
    const max = Math.max(currentYear + 3, selectedYear, ...itemYears);
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }, [items, selectedYear]);
  const visibleItems = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return items.filter((item) => item.planned_for.startsWith(monthPrefix));
  }, [items, selectedMonth, selectedYear]);

  const projectOptions: SelectOption[] = projects.map((project) => ({ value: project.id, label: project.name }));
  const profileOptions: SelectOption[] = profiles.filter((profile) => profile.is_active).map((profile) => ({ value: profile.id, label: profile.full_name }));
  const serviceOptions: SelectOption[] = services.map((service) => ({ value: service.id, label: service.title }));

  function moveMonth(direction: -1 | 1) {
    const next = new Date(selectedYear, selectedMonth + direction, 1);
    setSelectedYear(next.getFullYear());
    setSelectedMonth(next.getMonth());
  }

  function jumpToToday() {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  }

  function newItem() {
    setSelected(null);
    setMediaAssets([]);
    setCaption("");
    setOpen(true);
  }

  function editItem(item: ContentPlannerItemRecord) {
    setSelected(item);
    setMediaAssets(item.media_assets ?? []);
    setCaption(item.description ?? "");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setSelected(null);
    setMediaAssets([]);
    setCaption("");
  }

  function updateCaption(nextCaption: string, selectionStart?: number, selectionEnd?: number) {
    setCaption(nextCaption);
    window.requestAnimationFrame(() => {
      captionRef.current?.focus();
      if (selectionStart !== undefined && selectionEnd !== undefined) {
        captionRef.current?.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  }

  function transformSelectedCaption(transform: (text: string) => string, fallback: string) {
    const textarea = captionRef.current;
    const start = textarea?.selectionStart ?? caption.length;
    const end = textarea?.selectionEnd ?? caption.length;
    const selectedText = caption.slice(start, end) || fallback;
    const transformed = transform(selectedText);
    updateCaption(
      `${caption.slice(0, start)}${transformed}${caption.slice(end)}`,
      start,
      start + transformed.length,
    );
  }

  function insertCaptionSnippet(snippet: string, placement: "cursor" | "top" | "bottom" = "cursor") {
    if (placement === "top") {
      const prefix = caption.trim() ? "\n\n" : "";
      updateCaption(`${snippet}${prefix}${caption}`, snippet.length, snippet.length);
      return;
    }

    if (placement === "bottom") {
      const separator = caption.trim() ? "\n\n" : "";
      const nextCaption = `${caption}${separator}${snippet}`;
      updateCaption(nextCaption, nextCaption.length, nextCaption.length);
      return;
    }

    const textarea = captionRef.current;
    const start = textarea?.selectionStart ?? caption.length;
    const end = textarea?.selectionEnd ?? caption.length;
    const nextCaption = `${caption.slice(0, start)}${snippet}${caption.slice(end)}`;
    updateCaption(nextCaption, start + snippet.length, start + snippet.length);
  }

  function removeMediaAsset(id: string) {
    setMediaAssets((current) => current.filter((asset) => asset.id !== id));
  }

  async function uploadMediaImages(files: FileList | null) {
    const images = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;

    const remainingSlots = Math.max(0, 10 - mediaAssets.length);
    const acceptedImages = images.slice(0, remainingSlots);
    if (!acceptedImages.length) {
      toast.error("Media limit reached", {
        description: "A content plan can hold up to 10 images for now.",
      });
      return;
    }

    setUploadingMedia(true);
    try {
      const uploaded: ContentPlannerMediaAsset[] = [];

      for (const file of acceptedImages) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("purpose", "content");

        const response = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const result = await response.json() as { url?: string; publicId?: string; error?: string };

        if (!response.ok || !result.url) {
          throw new Error(result.error ?? `Unable to upload ${file.name}.`);
        }

        uploaded.push({
          id: crypto.randomUUID(),
          url: result.url,
          publicId: result.publicId ?? null,
          provider: "cloudinary",
          mimeType: file.type,
          fileName: file.name,
          alt: null,
        });
      }

      setMediaAssets((current) => [...current, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      toast.error("Could not upload image", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploadingMedia(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    const result = await saveContentPlannerItem({
      title: String(data.get("title") ?? ""),
      channel: String(data.get("channel") ?? ""),
      content_type: String(data.get("content_type") ?? ""),
      status: String(data.get("status") ?? "IDEA"),
      planned_for: String(data.get("planned_for") ?? ""),
      description: caption,
      owner_id: String(data.get("owner_id") ?? ""),
      project_id: String(data.get("project_id") ?? ""),
      service_id: String(data.get("service_id") ?? ""),
      media_assets: mediaAssets,
    }, selected?.id);
    setBusy(false);
    if (!result.ok) toast.error("Could not save content item", { description: result.error });
    else {
      toast.success(result.message);
      closeModal();
      router.refresh();
    }
  }

  async function remove() {
    if (!selected || !window.confirm("Delete this content planner item?")) return;
    setBusy(true);
    const result = await deleteContentPlannerItem(selected.id);
    setBusy(false);
    if (!result.ok) toast.error("Could not delete content item", { description: result.error });
    else {
      toast.success(result.message);
      closeModal();
      router.refresh();
    }
  }

  return (
    <section className="flex min-h-[calc(100dvh-8rem)] flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Content operations</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">Content Planner</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Plan launches, service posts, project updates, and client-facing content in a calendar view.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={() => moveMonth(-1)} className="h-11 rounded-xl border border-cyan-300/15 px-3 text-xs font-black uppercase tracking-widest text-muted transition hover:border-secondary hover:text-secondary">
            Prev
          </button>
          <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))} className="h-11 rounded-xl border border-cyan-300/15 bg-surface/60 px-3 text-sm font-bold text-primary outline-none focus:border-secondary">
            {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
          </select>
          <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} className="h-11 rounded-xl border border-cyan-300/15 bg-surface/60 px-3 text-sm font-bold text-primary outline-none focus:border-secondary">
            {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <button type="button" onClick={() => moveMonth(1)} className="h-11 rounded-xl border border-cyan-300/15 px-3 text-xs font-black uppercase tracking-widest text-muted transition hover:border-secondary hover:text-secondary">
            Next
          </button>
          <button type="button" onClick={jumpToToday} className="h-11 rounded-xl border border-cyan-300/15 px-3 text-xs font-black uppercase tracking-widest text-muted transition hover:border-secondary hover:text-secondary">
            Today
          </button>
          <button type="button" onClick={newItem} className="primary-btn inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-widest text-white">
            <Plus size={16} />
            Add content
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-h-0 overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="flex items-center gap-2 border-b border-cyan-300/10 px-5 py-4">
            <CalendarDays size={17} className="text-secondary" />
            <h2 className="font-black text-primary">{monthLabel}</h2>
            <span className="ml-auto rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
              {visibleItems.length} items
            </span>
          </div>
          <div className="grid grid-cols-7 border-b border-cyan-300/10 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-2 py-3">{day}</div>)}
          </div>
          <div className="grid h-[calc(100dvh-20rem)] min-h-[30rem] grid-cols-7 overflow-y-auto">
            {days.map((day) => {
              const dateKey = formatDateKey(day);
              const dayItems = items.filter((item) => item.planned_for === dateKey);
              const muted = day.getMonth() !== monthStart.getMonth();
              return (
                <div key={dateKey} className="min-h-28 border-b border-r border-cyan-300/10 p-2">
                  <p className={`text-xs font-bold ${muted ? "text-muted/40" : "text-primary"}`}>{day.getDate()}</p>
                  <div className="mt-2 space-y-1.5">
                    {dayItems.slice(0, 3).map((item) => (
                      <button key={item.id} type="button" onClick={() => editItem(item)} className="block w-full rounded-lg bg-cyan-300/10 px-2 py-1.5 text-left text-[11px] font-bold leading-4 text-secondary hover:bg-cyan-300/15">
                        {item.title}
                        {item.media_assets?.length ? <span className="ml-1 text-[10px] text-cyan-100/70">({item.media_assets.length} media)</span> : null}
                      </button>
                    ))}
                    {dayItems.length > 3 ? <p className="text-[10px] text-muted">+{dayItems.length - 3} more</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="border-b border-cyan-300/10 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Upcoming queue</p>
            <h2 className="mt-1 font-black text-primary">{monthLabel} content items</h2>
          </div>
          <div className="max-h-[calc(100dvh-16rem)] divide-y divide-cyan-300/10 overflow-y-auto">
            {visibleItems.length ? visibleItems.map((item) => (
              <article key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-primary">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">{item.planned_for} - {item.channel} - {item.status}</p>
                    {item.owner_id ? <p className="mt-1 text-xs text-muted">Owner: {names.get(item.owner_id) ?? "Team member"}</p> : null}
                    {item.media_assets?.length ? (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        <ImageIcon size={12} />
                        {item.media_assets.length} image{item.media_assets.length === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => editItem(item)} className="rounded-lg p-2 text-secondary hover:bg-cyan-300/10" aria-label={`Edit ${item.title}`}><Pencil size={15} /></button>
                </div>
              </article>
            )) : <p className="p-8 text-center text-sm text-muted">No planned content for {monthLabel} yet.</p>}
          </div>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={submit} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-surface sm:max-h-[calc(100dvh-3rem)]">
            <div className="shrink-0 border-b border-cyan-300/10 bg-surface/95 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">{selected ? "Update item" : "Create item"}</p>
                <h2 className="mt-1 text-xl font-black text-primary">{selected ? selected.title : "New content plan"}</h2>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-muted hover:bg-cyan-300/10 hover:text-primary" aria-label="Close"><X size={16} /></button>
              </div>
            </div>
            <div className="custom-scrollbar grid flex-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
              <Field label="Title" name="title" defaultValue={selected?.title ?? ""} required />
              <Field label="Planned date" name="planned_for" type="date" defaultValue={selected?.planned_for ?? formatDateKey(new Date(selectedYear, selectedMonth, 1))} required />
              <Field label="Channel" name="channel" defaultValue={selected?.channel ?? "Website"} required />
              <Field label="Content type" name="content_type" defaultValue={selected?.content_type ?? "Post"} required />
              <Select label="Status" name="status" defaultValue={selected?.status ?? "IDEA"} options={CONTENT_STATUSES.map((status) => ({ value: status, label: status.replaceAll("_", " ") }))} />
              <Select label="Owner" name="owner_id" defaultValue={selected?.owner_id ?? ""} options={profileOptions} />
              <Select label="Project" name="project_id" defaultValue={selected?.project_id ?? ""} options={projectOptions} />
              <Select label="Service category" name="service_id" defaultValue={selected?.service_id ?? ""} options={serviceOptions} />
              <div className="sm:col-span-2">
                <CaptionComposer
                  refObject={captionRef}
                  value={caption}
                  onChange={setCaption}
                  onBold={() => transformSelectedCaption(toUnicodeBold, "bold text")}
                  onItalic={() => transformSelectedCaption(toUnicodeItalic, "italic text")}
                  onBulletList={() => insertCaptionSnippet("• First point\n• Second point\n• Third point")}
                  onNumberedList={() => insertCaptionSnippet("1. First point\n2. Second point\n3. Third point")}
                  onQuote={() => insertCaptionSnippet("“Your quote or key message here.”")}
                  onTopHashtags={() => insertCaptionSnippet("#CreatiqDigitalSolutions #CreateInnovateElevate #DigitalSolutions", "top")}
                  onBottomHashtags={() => insertCaptionSnippet("#CreatiqDigitalSolutions #CreateInnovateElevate #CreativeExcellence #DigitalSolutions", "bottom")}
                  onCta={() => insertCaptionSnippet("📩 Let’s build something exceptional together.", "bottom")}
                  onTemplate={() => insertCaptionSnippet("Why choose Creatiq Digital Solutions?\n\nWe combine creativity, innovation, and reliability to help brands stand out and grow with confidence.\n\nCreate. Innovate. Elevate.\n\n📩 Let’s build something exceptional together.\n#CreatiqDigitalSolutions #CreateInnovateElevate #CreativeExcellence #DigitalSolutions")}
                />
              </div>
              <div className="sm:col-span-2">
                <div className="rounded-2xl border border-cyan-300/15 bg-background/35 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Post images</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Add one or more creatives for this planned post. Saved metadata is automation-ready for future Facebook/page publishing.
                      </p>
                    </div>
                    <label className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-300/20 px-3 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:bg-cyan-300/10 ${uploadingMedia ? "pointer-events-none opacity-60" : ""}`}>
                      <Upload size={14} />
                      {uploadingMedia ? "Uploading..." : "Upload images"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingMedia}
                        onChange={(event) => {
                          void uploadMediaImages(event.target.files);
                          event.currentTarget.value = "";
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {mediaAssets.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {mediaAssets.map((asset, index) => (
                        <div key={asset.id} className="group relative overflow-hidden rounded-xl border border-cyan-300/15 bg-surface/80">
                          <div className="relative aspect-video bg-background/80">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={asset.url} alt={asset.alt ?? asset.fileName ?? `Content media ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex items-center justify-between gap-2 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-primary">{asset.fileName ?? `Image ${index + 1}`}</p>
                              <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted">Image {index + 1}</p>
                            </div>
                            <button type="button" onClick={() => removeMediaAsset(asset.id)} className="rounded-lg border border-red-300/25 p-2 text-red-200 transition hover:bg-red-300/10" aria-label="Remove image">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-cyan-300/20 text-center text-xs leading-5 text-muted">
                      No images attached yet. Upload the post creatives here.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex gap-2 border-t border-cyan-300/10 bg-surface/95 p-5 backdrop-blur">
              <button disabled={busy} className="primary-btn inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"><Save size={15} />{busy ? "Saving..." : "Save"}</button>
              {selected ? <button disabled={busy} type="button" onClick={remove} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-300/30 text-red-200 hover:bg-red-300/10" aria-label="Delete item"><Trash2 size={16} /></button> : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function buildMonthDays(monthStart: Date) {
  const start = new Date(monthStart);
  start.setDate(1 - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function formatDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function CaptionComposer({
  refObject,
  value,
  onChange,
  onBold,
  onItalic,
  onBulletList,
  onNumberedList,
  onQuote,
  onTopHashtags,
  onBottomHashtags,
  onCta,
  onTemplate,
}: {
  refObject: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onBold: () => void;
  onItalic: () => void;
  onBulletList: () => void;
  onNumberedList: () => void;
  onQuote: () => void;
  onTopHashtags: () => void;
  onBottomHashtags: () => void;
  onCta: () => void;
  onTemplate: () => void;
}) {
  const characterCount = value.length;
  const hashtagCount = value.match(/(^|\s)#([a-zA-Z0-9_]+)/g)?.length ?? 0;

  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-background/35 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Facebook-ready caption
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            Bold and italic use Unicode-styled characters so the visual style can
            carry into Facebook captions. Hashtags are saved as real #hashtags.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ToolbarButton label="Bold" onClick={onBold} icon={Bold} />
          <ToolbarButton label="Italic" onClick={onItalic} icon={Italic} />
          <ToolbarButton label="Bullets" onClick={onBulletList} icon={List} />
          <ToolbarButton label="Numbers" onClick={onNumberedList} icon={ListOrdered} />
          <ToolbarButton label="Quote" onClick={onQuote} icon={Quote} />
          <ToolbarButton label="Top #" onClick={onTopHashtags} icon={Hash} />
          <ToolbarButton label="Bottom #" onClick={onBottomHashtags} icon={Hash} />
          <ToolbarButton label="CTA" onClick={onCta} icon={MessageSquareText} />
          <ToolbarButton label="Template" onClick={onTemplate} icon={Sparkles} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Caption / Description
          </span>
          <textarea
            ref={refObject}
            name="description"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Write the post caption here..."
            className="mt-1.5 min-h-56 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 py-2 text-sm leading-6 text-primary outline-none focus:border-secondary"
          />
          <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span>{characterCount} characters</span>
            <span>•</span>
            <span>{hashtagCount} hashtag{hashtagCount === 1 ? "" : "s"}</span>
          </span>
        </label>

        <div className="rounded-xl border border-cyan-300/15 bg-surface/70 p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/10 text-secondary">
              C
            </span>
            <div>
              <p className="text-sm font-black text-primary">Creatiq</p>
              <p className="text-[10px] uppercase tracking-widest text-muted">
                Preview
              </p>
            </div>
          </div>
          <div className="whitespace-pre-wrap break-words text-sm leading-6 text-primary">
            {value ? <CaptionPreview text={value} /> : <span className="text-muted">Your caption preview will appear here.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  icon: typeof Bold;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cyan-300/15 bg-surface/70 px-2.5 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:border-secondary hover:bg-cyan-300/10"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function CaptionPreview({ text }: { text: string }) {
  const parts = text.split(/(#\w+)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("#") ? (
          <span key={`${part}-${index}`} className="font-bold text-secondary">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function toUnicodeBold(value: string) {
  return mapUnicodeStyle(
    value,
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
  );
}

function toUnicodeItalic(value: string) {
  return mapUnicodeStyle(
    value,
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻",
  );
}

function mapUnicodeStyle(value: string, source: string, target: string) {
  const sourceChars = Array.from(source);
  const targetChars = Array.from(target);
  const map = new Map(sourceChars.map((char, index) => [char, targetChars[index]]));
  return Array.from(value, (char) => map.get(char) ?? char).join("");
}

function Field({ label, name, defaultValue, type = "text", required = false }: { label: string; name: string; defaultValue: string; type?: string; required?: boolean }) {
  return <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</span><input name={name} type={type} required={required} defaultValue={defaultValue} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" /></label>;
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: SelectOption[] }) {
  return <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</span><select name={name} defaultValue={defaultValue} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary"><option value="">Not set</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
