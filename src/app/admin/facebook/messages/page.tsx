import Link from "next/link";
import {
  Check,
  CheckCheck,
  Inbox,
  MessageCircle,
  MousePointerClick,
  Radio,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AutoSubmitFilterForm } from "@/components/admin/auto-submit-filter-form";
import { AutoScrollChat } from "@/components/admin/auto-scroll-chat";
import { FacebookHistorySyncButton } from "@/components/admin/facebook-history-sync";
import { FacebookMessengerRealtime } from "@/components/admin/facebook-messenger-realtime";
import { FacebookReplyComposer } from "@/components/admin/facebook-reply-composer";
import { PaginationControls, type PageSize } from "@/components/admin/pagination-controls";
import { requireModuleAccess } from "@/lib/crm/auth";
import type { FacebookConversationRecord, MetaWebhookEventRecord } from "@/lib/crm/types";
import { getFacebookMessengerProfile } from "@/lib/meta/facebook";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const conversationsResult = await supabase
    .from("facebook_conversations")
    .select("id, page_id, psid, display_name, raw_profile, last_event_type, last_message_text, last_message_at, unread_count, created_at, updated_at")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(80);

  if (conversationsResult.error) {
    return <FacebookInboxError message={conversationsResult.error.message} />;
  }

  const conversations = await hydrateMissingConversationProfiles(
    (conversationsResult.data ?? []) as FacebookConversationRecord[],
  );
  const activeConversation =
    conversations.find((conversation) => conversation.psid === selectedPsid) ??
    conversations[0] ??
    null;
  const effectivePsid = activeConversation?.psid ?? selectedPsid;

  let eventsQuery = supabase
    .from("meta_webhook_events")
    .select("id, page_id, event_type, sender_id, recipient_id, participant_id, message_id, message_text, postback_payload, delivery_watermark, read_watermark, is_echo, raw_event, occurred_at, created_at", { count: "exact" })
    .order("occurred_at", { ascending: true, nullsFirst: false });

  if (effectivePsid) {
    eventsQuery = eventsQuery.or(
      `participant_id.eq.${effectivePsid},sender_id.eq.${effectivePsid},recipient_id.eq.${effectivePsid}`,
    );
  }
  if (type) eventsQuery = eventsQuery.eq("event_type", type);

  if (pageSize !== "all") {
    const from = (page - 1) * pageSize;
    eventsQuery = eventsQuery.range(from, from + pageSize - 1);
  }

  const eventsResult = await eventsQuery;

  if (eventsResult.error) {
    return <FacebookInboxError message={eventsResult.error.message} />;
  }

  const events = (eventsResult.data ?? []) as MetaWebhookEventRecord[];
  const total = eventsResult.count ?? events.length;
  const visibleEvents = type
    ? events
    : events.filter((event) => !["DELIVERY", "READ"].includes(event.event_type));

  return (
    <section className="flex min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Facebook Page
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">
            Messenger Inbox
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Read and reply to Facebook Page Messenger conversations directly from
            your CRM.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FacebookMessengerRealtime />
          <FacebookHistorySyncButton />
        </div>
      </div>

      <div className="grid min-h-0 gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="flex h-[calc(100dvh-14rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="border-b border-cyan-300/10 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Conversations
            </p>
            <p className="mt-1 text-xs text-muted">{conversations.length} Messenger contacts</p>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 divide-y divide-cyan-300/10 overflow-y-auto">
            {conversations.length ? (
              conversations.map((conversation) => (
                <ConversationLink
                  key={conversation.id}
                  conversation={conversation}
                  active={effectivePsid === conversation.psid}
                  pageSize={pageSize}
                />
              ))
            ) : (
              <div className="flex min-h-[20rem] items-center justify-center p-6 text-center">
                <div>
                  <Inbox className="mx-auto text-secondary" size={30} />
                  <p className="mt-3 text-sm font-bold text-primary">No Messenger events yet.</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Send a new test message after deploying this webhook code,
                    or point Meta to a public tunnel for localhost.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex h-[calc(100dvh-14rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="flex flex-col gap-3 border-b border-cyan-300/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {activeConversation ? <ConversationAvatar conversation={activeConversation} size="md" /> : null}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                  Chat workspace
                </p>
                <h2 className="mt-1 font-black text-primary">
                  {activeConversation ? conversationName(activeConversation) : "Select a conversation"}
                </h2>
              </div>
            </div>
            <AutoSubmitFilterForm className="flex flex-wrap items-center gap-2">
              {effectivePsid ? <input type="hidden" name="conversation" value={effectivePsid} /> : null}
              <input type="hidden" name="limit" value={pageSize} />
              <select
                name="type"
                defaultValue={type}
                className="h-10 rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-xs font-bold text-primary outline-none focus:border-secondary"
              >
                <option value="">All chat events</option>
                <option value="MESSAGE">Messages</option>
                <option value="POSTBACK">Postbacks</option>
                <option value="DELIVERY">Deliveries</option>
                <option value="READ">Reads</option>
                <option value="ECHO">Sent by page</option>
              </select>
            </AutoSubmitFilterForm>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto py-2">
            {visibleEvents.length ? (
              <AutoScrollChat>
                {visibleEvents.map((event) => (
                  <MetaEventRow
                    key={event.id}
                    event={event}
                    events={events}
                    conversation={activeConversation}
                  />
                ))}
              </AutoScrollChat>
            ) : (
              <div className="flex min-h-[20rem] items-center justify-center p-6 text-center">
                <div>
                  <MessageCircle className="mx-auto text-secondary" size={30} />
                  <p className="mt-3 text-sm font-bold text-primary">No messages in this view.</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Try another conversation or event type.
                  </p>
                </div>
              </div>
            )}
          </div>

          {effectivePsid ? <FacebookReplyComposer psid={effectivePsid} /> : null}

          {total > (pageSize === "all" ? total : pageSize) ? (
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={total}
              extraParams={{
                conversation: effectivePsid || undefined,
                type: type || undefined,
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ConversationLink({
  conversation,
  active,
  pageSize,
}: {
  conversation: FacebookConversationRecord;
  active: boolean;
  pageSize: PageSize;
}) {
  return (
    <Link
      href={`/admin/facebook/messages?conversation=${conversation.psid}&limit=${pageSize}`}
      className={`block p-4 transition hover:bg-cyan-300/[0.05] ${
        active ? "bg-cyan-300/[0.08]" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <ConversationAvatar conversation={conversation} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-black text-primary">
              {conversationName(conversation)}
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
        </div>
      </div>
    </Link>
  );
}

function MetaEventRow({
  event,
  events,
  conversation,
}: {
  event: MetaWebhookEventRecord;
  events: MetaWebhookEventRecord[];
  conversation: FacebookConversationRecord | null;
}) {
  const Icon = eventIcons[event.event_type];
  const isOutgoing = event.is_echo;
  const isPostback = event.event_type === "POSTBACK";
  const copy = event.message_text ?? event.postback_payload ?? event.event_type;
  const status = isOutgoing ? outgoingStatus(event, events) : null;

  if (event.event_type === "DELIVERY") {
    return <SystemStatus text={`Delivered ${formatTime(event.delivery_watermark ?? event.occurred_at ?? event.created_at)}`} />;
  }

  if (event.event_type === "READ") {
    return <SystemStatus text={`Read ${formatTime(event.read_watermark ?? event.occurred_at ?? event.created_at)}`} />;
  }

  if (event.event_type === "OTHER" && copy.toLowerCase().includes("unsent")) {
    return <SystemStatus text="A message was unsent." />;
  }

  return (
    <article className={`flex px-5 py-3 ${isOutgoing ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[min(38rem,86%)] gap-3 ${isOutgoing ? "flex-row-reverse" : ""}`}>
        {isOutgoing ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-100">
            <Icon size={16} />
          </span>
        ) : (
          <ConversationAvatar conversation={conversation} />
        )}
        <div>
          <div
            className={`rounded-2xl border px-4 py-3 ${
              isOutgoing
                ? "rounded-br-md border-blue-300/20 bg-blue-500/20 text-blue-50"
                : "rounded-bl-md border-cyan-300/15 bg-background/55 text-primary"
            }`}
          >
            <div className={`flex flex-wrap items-center gap-2 ${isOutgoing ? "justify-end" : ""}`}>
              <h2 className="text-[10px] font-black uppercase tracking-widest opacity-80">
                {isOutgoing
                  ? "Creatiq Page"
                  : isPostback
                    ? "Postback"
                    : conversation ? conversationName(conversation) : event.event_type.replaceAll("_", " ")}
              </h2>
              <time className="text-[10px] font-bold uppercase tracking-widest opacity-55">
                {formatTime(event.occurred_at ?? event.created_at)}
              </time>
            </div>
            <p className={`mt-1 whitespace-pre-wrap break-words text-sm leading-6 ${isOutgoing ? "text-right" : ""}`}>
              {copy}
            </p>
          </div>
          {status ? (
            <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-widest text-muted/70">
              {status === "Sent" ? <Check size={11} /> : <CheckCheck size={11} />}
              {status}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SystemStatus({ text }: { text: string }) {
  return (
    <div className="flex justify-center px-5 py-2">
      <span className="rounded-full border border-cyan-300/10 bg-background/45 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted">
        {text}
      </span>
    </div>
  );
}

function ConversationAvatar({
  conversation,
  size = "sm",
}: {
  conversation: FacebookConversationRecord | null;
  size?: "sm" | "md";
}) {
  const image = conversation?.raw_profile?.profile_pic ?? null;
  const name = conversation ? conversationName(conversation) : "Messenger user";
  const className = size === "md" ? "h-11 w-11" : "h-10 w-10";

  if (image) {
    return (
      <span className={`${className} shrink-0 overflow-hidden rounded-full border border-cyan-300/20 bg-cyan-300/10`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-black text-secondary`}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function conversationName(conversation: FacebookConversationRecord) {
  return conversation.display_name || conversation.raw_profile?.displayName || `Messenger User ${conversation.psid.slice(0, 6)}`;
}

async function hydrateMissingConversationProfiles(conversations: FacebookConversationRecord[]) {
  const missing = conversations
    .filter((conversation) => !conversation.display_name)
    .slice(0, 8);

  if (!missing.length) return conversations;

  const admin = createSupabaseAdminClient();
  const updates = await Promise.all(
    missing.map(async (conversation) => {
      try {
        const profile = await getFacebookMessengerProfile(conversation.psid);
        if (!profile.displayName) return null;
        await admin
          .from("facebook_conversations")
          .update({
            display_name: profile.displayName,
            raw_profile: profile,
          })
          .eq("id", conversation.id);
        return { id: conversation.id, profile };
      } catch {
        return null;
      }
    }),
  );

  const profileById = new Map(updates.filter(Boolean).map((update) => [update!.id, update!.profile]));
  return conversations.map((conversation) => {
    const profile = profileById.get(conversation.id);
    return profile
      ? { ...conversation, display_name: profile.displayName, raw_profile: profile }
      : conversation;
  });
}

function outgoingStatus(event: MetaWebhookEventRecord, events: MetaWebhookEventRecord[]) {
  const eventTime = new Date(event.occurred_at ?? event.created_at).getTime();
  const hasRead = events.some((candidate) =>
    candidate.event_type === "READ" &&
    timestampValue(candidate.read_watermark ?? candidate.occurred_at ?? candidate.created_at) >= eventTime,
  );
  if (hasRead) return "Seen";
  const hasDelivery = events.some((candidate) =>
    candidate.event_type === "DELIVERY" &&
    timestampValue(candidate.delivery_watermark ?? candidate.occurred_at ?? candidate.created_at) >= eventTime,
  );
  if (hasDelivery) return "Delivered";
  return "Sent";
}

function timestampValue(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function FacebookInboxError({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-red-300/20 bg-red-950/25 p-6">
      <p className="text-sm font-bold text-red-100">Couldn&apos;t load Messenger Inbox</p>
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
  return allowedPageSizes.includes(size as PageSize) ? size as PageSize : "all";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
