import { NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/crm/auth";
import {
  assertFacebookPageConfig,
  getFacebookConversationMessages,
  getFacebookPageConversations,
} from "@/lib/meta/facebook";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireModuleAccess("facebook");
  const url = new URL(request.url);
  const psid = url.searchParams.get("conversation")?.trim();

  if (!psid) {
    return NextResponse.json(
      { ok: false, error: "Conversation is required." },
      { status: 400 },
    );
  }

  const result = await syncFacebookConversationByPsid(psid);
  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}

async function syncFacebookConversationByPsid(psid: string) {
  const { pageId } = assertFacebookPageConfig();
  const admin = createSupabaseAdminClient();
  const conversations = await getFacebookPageConversations(100, 10);
  const conversation = conversations.find((item) =>
    item.participants?.data?.some((participant) => participant.id === psid),
  );

  if (!conversation) {
    return { ok: true, imported: 0, changed: false };
  }

  const participant = conversation.participants?.data?.find(
    (person) => person.id && person.id !== pageId,
  );
  const messages = (await getFacebookConversationMessages(conversation.id, 50, 3)).sort(
    (a, b) => timestampValue(a.created_time) - timestampValue(b.created_time),
  );
  const latestMessage = messages[messages.length - 1];
  const latestAt = toIso(latestMessage?.created_time ?? conversation.updated_time);
  const latestText = latestMessage ? messageText(latestMessage) : null;
  let imported = 0;

  if (latestMessage) {
    const { error } = await admin.from("facebook_conversations").upsert(
      {
        page_id: pageId,
        psid,
        display_name: participant?.name ?? null,
        raw_profile: participant
          ? {
              id: psid,
              displayName: participant.name ?? null,
              name: participant.name ?? null,
              profile_pic: participant.picture?.data?.url ?? null,
            }
          : undefined,
        last_event_type: latestMessage.from?.id === pageId ? "ECHO" : "MESSAGE",
        last_message_text: latestText,
        last_message_at: latestAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page_id,psid" },
    );
    if (error) throw new Error(error.message);
  }

  for (const message of messages) {
    if (!message.id) continue;
    const isEcho = message.from?.id === pageId;
    const participantId = deriveMessageParticipantId(message, pageId) ?? psid;
    const { error } = await admin.from("meta_webhook_events").insert({
      page_id: pageId,
      event_type: isEcho ? "ECHO" : "MESSAGE",
      sender_id: message.from?.id ?? null,
      recipient_id: isEcho ? participantId : pageId,
      participant_id: participantId,
      message_id: message.id,
      message_text: messageText(message),
      is_echo: isEcho,
      raw_event: {
        source: "active_conversation_graph_sync",
        conversation_id: conversation.id,
        message,
      },
      occurred_at: toIso(message.created_time ?? latestAt),
    });

    if (error && !isDuplicateDbError(error)) throw new Error(error.message);
    if (!error) imported += 1;
  }

  return { ok: true, imported, changed: imported > 0 };
}

function timestampValue(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function toIso(value?: string | null) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function deriveMessageParticipantId(
  message: {
    from?: { id?: string };
    to?: { data?: Array<{ id?: string }> };
  },
  pageId: string,
) {
  if (message.from?.id && message.from.id !== pageId) return message.from.id;
  return message.to?.data?.find((person) => person.id && person.id !== pageId)?.id ?? null;
}

function isDuplicateDbError(error: { code?: string; message?: string }) {
  return error.code === "23505" || (error.message ?? "").toLowerCase().includes("duplicate");
}

function messageText(message: { message?: string; attachments?: { data?: unknown[] } }) {
  return message.message?.trim() || (message.attachments?.data?.length ? "[Attachment]" : "");
}
