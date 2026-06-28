import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/crm/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type VersionPart = {
  table: string;
  id: string;
  changedAt: string;
};

const VERSION_TABLES = [
  { table: "activity_logs", columns: "id, created_at", order: "created_at" },
  { table: "profiles", columns: "id, updated_at", order: "updated_at" },
  { table: "company_settings", columns: "id, updated_at", order: "updated_at" },
  { table: "services", columns: "id, updated_at", order: "updated_at" },
  { table: "clients", columns: "id, updated_at", order: "updated_at" },
  { table: "inquiries", columns: "id, updated_at", order: "updated_at" },
  { table: "projects", columns: "id, updated_at", order: "updated_at" },
  { table: "tasks", columns: "id, updated_at", order: "updated_at" },
  { table: "customer_reviews", columns: "id, updated_at", order: "updated_at" },
  { table: "access_roles", columns: "id, updated_at", order: "updated_at" },
  { table: "content_planner_items", columns: "id, updated_at", order: "updated_at" },
  { table: "admin_security_requests", columns: "id, created_at", order: "created_at" },
  { table: "facebook_conversations", columns: "id, updated_at", order: "updated_at" },
  { table: "meta_webhook_events", columns: "id, created_at", order: "created_at" },
] as const;

export async function GET() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const parts = await Promise.all(
    VERSION_TABLES.map(async (config): Promise<VersionPart> => {
      const result = await supabase
        .from(config.table)
        .select(config.columns)
        .order(config.order, { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (result.error) {
        return {
          table: config.table,
          id: "error",
          changedAt: result.error.message,
        };
      }

      const row = result.data as
        | { id?: string; updated_at?: string; created_at?: string }
        | null;

      return {
        table: config.table,
        id: row?.id ?? "empty",
        changedAt: row?.updated_at ?? row?.created_at ?? "empty",
      };
    }),
  );

  return NextResponse.json(
    {
      version: parts
        .map((part) => `${part.table}:${part.id}:${part.changedAt}`)
        .join("|"),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
