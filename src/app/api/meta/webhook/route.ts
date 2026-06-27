import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

  if (mode === "subscribe" && token && token === metaVerifyToken() && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Meta webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.info("Meta webhook event received:", JSON.stringify(payload).slice(0, 2_000));
  } catch {
    console.info("Meta webhook event received with an unreadable body.");
  }

  return NextResponse.json({ ok: true });
}
