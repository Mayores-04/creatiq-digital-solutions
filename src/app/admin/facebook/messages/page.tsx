import Link from "next/link";
import { CheckCheck, Inbox, MessageCircle, MousePointerClick, Radio, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AutoSubmitFilterForm } from "@/components/admin/auto-submit-filter-form";
import { PaginationControls, type PageSize } from "@/components/admin/pagination-controls";
import { requireModuleAccess } from "@/lib/crm/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FacebookConversationRecord, MetaWebhookEventRecord } from "@/lib/crm/types";

type SearchParams = Promise<{
  conversation?: string;
  page?: string;
  limit?: string;
  type?: string;
}>;

const allowedPageSizes: PageSize[] = [25, 50, 100, "all"];
const eventIcons: Record<MetaWebhookEventRecord["event_type"], LucideIcon> = {
  MESSAGE: MessageCircle,
  POSTBACK: MousePointerClick,
  DELIVERY: CheckCheck,
  READ: CheckCheck,
  ECHO: Send,
  OTHER: Radio,
};

export default async function FacebookMessengerInboxPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireModuleAccess("facebook");
  const params = await searchParams;
  const selectedPsid = params.conversation ?? "";
  const type = params.type ?? "";
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.limit);
  const supabase = await createSupabaseServerClient();

  const conversationsQuery = supabase
    .from("facebook_conversations")
    .select("id, page_id, psid, display_name, last_event_type, last_message_text, last_message_at, unread_count, created_at, updated_at")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(80);

  let eventsQuery = supabase
    .from("meta_webhook_events")
    .select("id, page_id, event_type, sender_id, recipient_id, participant_id, message_id, message_text, postback_payload, delivery_watermark, read_watermark, is_echo, raw_event, occurred_at, created_at", { count: "exact" })
    .order("occurred_at", { ascending: false, nullsFirst: false });

  if (selectedPsid) eventsQuery = eventsQuery.eq("participant_id", selectedPsid);
  if (type) eventsQuery = eventsQuery.eq("event_type", type);

  if (pageSize !== "all") {
    const from = (page - 1) * pageSize;
    eventsQuery = eventsQuery.range(from, from + pageSize - 1);
  }

  const [conversationsResult, eventsResult] = await Promise.all([
    conversationsQuery,
    eventsQuery,
  ]);

  if (conversationsResult.error || eventsResult.error) {
    const message = conversationsResult.error?.message ?? eventsResult.error?.message ?? "Unable to load Facebook messages.";
    return <FacebookInboxError message={message} />;
  }

  const conversations = (conversationsResult.data ?? []) as FacebookConversationRecord[];
  const events = (eventsResult.data ?? []) as MetaWebhookEventRecord[];
  const total = eventsResult.count ?? events.length;
  const activeConversation =
    conversations.find((conversation) => conversation.psid === selectedPsid) ?? null;
  const effectivePsid = activeConversation?.psid ?? selectedPsid;

  return (
    <section className="flex min-h-0 flex-col gap-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
          Facebook Page
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">
          Messenger Inbox
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Incoming messages, postbacks, delivery receipts, read receipts, and
          echoes saved from your Meta webhook.
        </p>
      </div>

      <div className="grid min-h-0 gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="flex h-[calc(100dvh-14rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="border-b border-cyan-300/10 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Conversations
            </p>
            <p className="mt-1 text-xs text-muted">{conversations.length} webhook contacts</p>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 divide-y divide-cyan-300/10 overflow-y-auto">
            {conversations.length ? (
              conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/admin/facebook/messages?conversation=${conversation.psid}&limit=${pageSize}`}
                  className={`block p-4 transition hover:bg-cyan-300/[0.05] ${
                    effectivePsid === conversation.psid ? "bg-cyan-300/[0.08]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-black text-primary">
                      {conversation.display_name ?? `PSID ${conversation.psid.slice(0, 8)}...`}
                    </p>
                    {conversation.unread_count > 0 ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-background">
                        {conversation.unread_count}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {conversation.last_message_text ?? conversation.last_event_type ?? "Meta event"}
                  </p>
                  <time className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-muted/70">
                    {conversation.last_message_at ? formatTime(conversation.last_message_at) : "No time"}
                  </time>
                </Link>
              ))
            ) : (
              <div className="flex min-h-[20rem] items-center justify-center p-6 text-center">
                <div>
                  <Inbox className="mx-auto text-secondary" size={30} />
                  <p className="mt-3 text-sm font-bold text-primary">No Messenger events yet.</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Send a new test message to the Facebook Page after applying
                    the database migration.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex h-[calc(100dvh-14rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="flex flex-col gap-3 border-b border-cyan-300/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Event timeline
              </p>
              <h2 className="mt-1 font-black text-primary">
                {effectivePsid ? `Conversation ${effectivePsid.slice(0, 12)}...` : "All webhook events"}
              </h2>
            </div>
            <AutoSubmitFilterForm className="flex flex-wrap items-center gap-2">
              {effectivePsid ? <input type="hidden" name="conversation" value={effectivePsid} /> : null}
              <input type="hidden" name="limit" value={pageSize} />
              <select
                name="type"
                defaultValue={type}
                className="h-10 rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-xs font-bold text-primary outline-none focus:border-secondary"
              >
                <option value="">All events</option>
                <option value="MESSAGE">Messages</option>
                <option value="POSTBACK">Postbacks</option>
                <option value="DELIVERY">Deliveries</option>
                <option value="READ">Reads</option>
                <option value="ECHO">Echoes</option>
              </select>
            </AutoSubmitFilterForm>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 divide-y divide-cyan-300/10 overflow-y-auto">
            {events.length ? (
              events.map((event) => <MetaEventRow key={event.id} event={event} />)
            ) : (
              <div className="flex min-h-[20rem] items-center justify-center p-6 text-center">
                <div>
                  <MessageCircle className="mx-auto text-secondary" size={30} />
                  <p className="mt-3 text-sm font-bold text-primary">No events in this view.</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Try another conversation or event type.
                  </p>
                </div>
              </div>
            )}
          </div>

          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={total}
            extraParams={{
              conversation: effectivePsid || undefined,
              type: type || undefined,
            }}
          />
        </div>
      </div>
    </section>
  );
}

function MetaEventRow({ event }: { event: MetaWebhookEventRecord }) {
  const Icon = eventIcons[event.event_type];
  const isOutgoing = event.is_echo;
  const copy = event.message_text ?? event.postback_payload ?? event.event_type;

  return (
    <article className="flex gap-4 px-5 py-4 transition hover:bg-cyan-300/[0.04]">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-secondary">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-sm font-bold text-primary">
            {event.event_type.replaceAll("_", " ")}
            {isOutgoing ? <span className="ml-2 text-xs font-normal text-muted">Page echo</span> : null}
          </h2>
          <time className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted/70">
            {formatTime(event.occurred_at ?? event.created_at)}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted">
          {copy}
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted/60">
          Sender {event.sender_id ?? "n/a"} · Recipient {event.recipient_id ?? "n/a"}
        </p>
      </div>
    </article>
  );
}

function FacebookInboxError({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-red-300/20 bg-red-950/25 p-6">
      <p className="text-sm font-bold text-red-100">Couldn’t load Messenger Inbox</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100/75">{message}</p>
      <p className="mt-4 text-xs leading-5 text-red-100/65">
        If this says the table does not exist, apply the newest Supabase
        migration first, then send another Messenger test event.
      </p>
    </section>
  );
}

function normalizePage(value: string | undefined) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function normalizePageSize(value: string | undefined): PageSize {
  if (value === "all") return "all";
  const size = Number(value);
  return allowedPageSizes.includes(size as PageSize) ? size as PageSize : 25;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
