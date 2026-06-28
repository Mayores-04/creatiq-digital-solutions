import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MetaMessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    attachments?: unknown[];
  };
  postback?: {
    title?: string;
    payload?: string;
  };
  delivery?: {
    mids?: string[];
    watermark?: number;
  };
  read?: {
    watermark?: number;
  };
};

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: MetaMessagingEvent[];
  }>;
};

function metaVerifyToken() {
  return (
    process.env.META_VERIFY_TOKEN ??
    process.env.META_WEBHOOK_VERIFY_TOKEN ??
    process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ??
    process.env.CREATIQ_META_VERIFY_TOKEN_2026 ??
    ""
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === metaVerifyToken() &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  return NextResponse.json(
    { error: "Meta webhook verification failed." },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MetaWebhookPayload;
    console.info(
      "Meta webhook event received:",
      JSON.stringify(payload).slice(0, 2_000),
    );

    if (payload.object === "page") {
      await persistMetaWebhookPayload(payload);
    }
  } catch {
    console.info("Meta webhook event received with an unreadable body.");
  }

  return NextResponse.json({ ok: true });
}

async function persistMetaWebhookPayload(payload: MetaWebhookPayload) {
  try {
    const supabase = createSupabaseAdminClient();

    for (const entry of payload.entry ?? []) {
      const pageId = entry.id ?? "";
      if (!pageId) continue;

      for (const event of entry.messaging ?? []) {
        const record = normalizeMessagingEvent(pageId, event);
        if (!record) continue;

        const { error } = await supabase.from("meta_webhook_events").insert({
          page_id: record.pageId,
          event_type: record.eventType,
          sender_id: record.senderId,
          recipient_id: record.recipientId,
          participant_id: record.participantId,
          message_id: record.messageId,
          message_text: record.messageText,
          postback_payload: record.postbackPayload,
          delivery_watermark: record.deliveryWatermark,
          read_watermark: record.readWatermark,
          is_echo: record.isEcho,
          raw_event: event,
          occurred_at: record.occurredAt,
        });

        if (error && !error.message.toLowerCase().includes("duplicate")) {
          console.error("Unable to save Meta webhook event:", error.message);
        }

        if (record.participantId) {
          await upsertConversation(record);
        }
      }
    }
  } catch (error) {
    console.error("Unable to persist Meta webhook payload:", error);
  }
}

function normalizeMessagingEvent(pageId: string, event: MetaMessagingEvent) {
  const senderId = event.sender?.id ?? null;
  const recipientId = event.recipient?.id ?? null;
  const participantId =
    senderId && senderId !== pageId ? senderId : recipientId && recipientId !== pageId ? recipientId : senderId;
  const occurredAt = event.timestamp
    ? new Date(event.timestamp).toISOString()
    : new Date().toISOString();

  if (event.message) {
    const isEcho = event.message.is_echo === true;
    return {
      pageId,
      eventType: isEcho ? "ECHO" : "MESSAGE",
      senderId,
      recipientId,
      participantId,
      messageId: event.message.mid ?? null,
      messageText: event.message.text ?? (event.message.attachments?.length ? "[Attachment]" : null),
      postbackPayload: null,
      deliveryWatermark: null,
      readWatermark: null,
      isEcho,
      occurredAt,
    };
  }

  if (event.postback) {
    return {
      pageId,
      eventType: "POSTBACK",
      senderId,
      recipientId,
      participantId,
      messageId: null,
      messageText: event.postback.title ?? null,
      postbackPayload: event.postback.payload ?? null,
      deliveryWatermark: null,
      readWatermark: null,
      isEcho: false,
      occurredAt,
    };
  }

  if (event.delivery) {
    return {
      pageId,
      eventType: "DELIVERY",
      senderId,
      recipientId,
      participantId,
      messageId: event.delivery.mids?.[0] ?? null,
      messageText: null,
      postbackPayload: null,
      deliveryWatermark: event.delivery.watermark ? new Date(event.delivery.watermark).toISOString() : null,
      readWatermark: null,
      isEcho: false,
      occurredAt,
    };
  }

  if (event.read) {
    return {
      pageId,
      eventType: "READ",
      senderId,
      recipientId,
      participantId,
      messageId: null,
      messageText: null,
      postbackPayload: null,
      deliveryWatermark: null,
      readWatermark: event.read.watermark ? new Date(event.read.watermark).toISOString() : null,
      isEcho: false,
      occurredAt,
    };
  }

  return {
    pageId,
    eventType: "OTHER",
    senderId,
    recipientId,
    participantId,
    messageId: null,
    messageText: null,
    postbackPayload: null,
    deliveryWatermark: null,
    readWatermark: null,
    isEcho: false,
    occurredAt,
  };
}

async function upsertConversation(record: ReturnType<typeof normalizeMessagingEvent> & {}) {
  if (!record || !record.participantId) return;
  const supabase = createSupabaseAdminClient();
  const isUnreadMessage = record.eventType === "MESSAGE" && !record.isEcho;

  const { data: current } = await supabase
    .from("facebook_conversations")
    .select("id, unread_count")
    .eq("page_id", record.pageId)
    .eq("psid", record.participantId)
    .maybeSingle();

  const unreadCount =
    record.eventType === "READ"
      ? 0
      : isUnreadMessage
        ? Number(current?.unread_count ?? 0) + 1
        : Number(current?.unread_count ?? 0);

  await supabase.from("facebook_conversations").upsert(
    {
      page_id: record.pageId,
      psid: record.participantId,
      last_event_type: record.eventType,
      last_message_text: record.messageText,
      last_message_at: record.occurredAt,
      unread_count: unreadCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_id,psid" },
  );
}
