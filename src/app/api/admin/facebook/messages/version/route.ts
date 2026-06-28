import { NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/crm/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireModuleAccess("facebook");
  const supabase = await createSupabaseServerClient();

  const [latestEvent, latestConversation] = await Promise.all([
    supabase
      .from("meta_webhook_events")
      .select("id, occurred_at, created_at")
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("facebook_conversations")
      .select("id, updated_at, last_message_at")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (latestEvent.error) {
    return NextResponse.json({ error: latestEvent.error.message }, { status: 500 });
  }

  if (latestConversation.error) {
    return NextResponse.json(
      { error: latestConversation.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      version: [
        latestEvent.data?.id ?? "no-event",
        latestEvent.data?.created_at ?? latestEvent.data?.occurred_at ?? "no-event-time",
        latestConversation.data?.id ?? "no-conversation",
        latestConversation.data?.updated_at ?? latestConversation.data?.last_message_at ?? "no-conversation-time",
      ].join(":"),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
