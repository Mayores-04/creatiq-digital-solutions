import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminIdentity } from "@/lib/crm/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const signSchema = z.object({
  action: z.literal("sign"),
  projectId: z.uuid(),
  fileName: z.string().trim().min(1).max(180),
  contentType: z.string().trim().min(1).max(120),
});
const completeSchema = z.object({
  action: z.literal("complete"),
  projectId: z.uuid(),
  path: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().max(120).nullable(),
  byteSize: z.number().int().nonnegative().max(50 * 1024 * 1024),
});

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const supabase = await createSupabaseServerClient();

  const sign = signSchema.safeParse(payload);
  if (sign.success) {
    const safeName = sign.data.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${sign.data.projectId}/${randomUUID()}-${safeName}`;
    const { data, error } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET ?? "creatiq-digital-solutions").createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Unable to authorize upload." }, { status: 403 });
    return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl });
  }

  const complete = completeSchema.safeParse(payload);
  if (complete.success) {
    if (!complete.data.path.startsWith(`${complete.data.projectId}/`)) return NextResponse.json({ error: "Invalid document path." }, { status: 400 });
    const { error } = await supabase.from("project_documents").insert({
      project_id: complete.data.projectId,
      file_name: complete.data.fileName,
      storage_path: complete.data.path,
      mime_type: complete.data.mimeType,
      byte_size: complete.data.byteSize,
      uploaded_by: identity.id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid document request." }, { status: 400 });
}

export async function GET(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const documentId = new URL(request.url).searchParams.get("id");
  const parsed = z.uuid().safeParse(documentId);
  if (!parsed.success) return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: document, error: documentError } = await supabase.from("project_documents").select("storage_path").eq("id", parsed.data).single();
  if (documentError || !document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const { data, error } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET ?? "creatiq-digital-solutions").createSignedUrl(document.storage_path, 60);
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Unable to access document." }, { status: 403 });
  return NextResponse.json({ url: data.signedUrl });
}
