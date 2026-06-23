"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/crm/auth";
import { INQUIRY_STATUSES, PROJECT_STATUSES, TASK_STATUSES } from "@/lib/crm/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const resourceSchema = z.enum(["inquiries", "clients", "projects", "tasks", "services", "portfolio", "employees"]);
const mutationSchema = z.object({
  resource: resourceSchema,
  id: z.string().uuid().optional(),
  values: z.record(z.string(), z.unknown()),
});

export type CrmResource = z.infer<typeof resourceSchema>;
export type CrmMutation = z.infer<typeof mutationSchema>;
export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

function requiredText(values: Record<string, unknown>, key: string, max = 5_000) {
  const value = String(values[key] ?? "").trim();
  if (!value) throw new Error(`${key.replaceAll("_", " ")} is required.`);
  if (value.length > max) throw new Error(`${key.replaceAll("_", " ")} is too long.`);
  return value;
}

function optionalText(values: Record<string, unknown>, key: string, max = 5_000) {
  const value = String(values[key] ?? "").trim();
  if (value.length > max) throw new Error(`${key.replaceAll("_", " ")} is too long.`);
  return value || null;
}

function optionalUuid(values: Record<string, unknown>, key: string) {
  const value = String(values[key] ?? "").trim();
  return value ? z.uuid().parse(value) : null;
}

function integer(values: Record<string, unknown>, key: string, min = 0, max = 1_000_000) {
  const value = Number(values[key]);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${key.replaceAll("_", " ")} must be valid.`);
  return value;
}

function flag(values: Record<string, unknown>, key: string) {
  return values[key] === true || values[key] === "true" || values[key] === "on";
}

function dateOrNull(values: Record<string, unknown>, key: string) {
  const value = String(values[key] ?? "").trim();
  if (!value) return null;
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(value);
}

function slug(values: Record<string, unknown>, key: string) {
  const value = requiredText(values, key, 100).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error("Slug can only use lowercase letters, numbers, and hyphens.");
  return value;
}

async function logActivity(
  entityType: string,
  entityId: string | null,
  action: string,
  details: Record<string, unknown> = {},
) {
  const identity = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase.from("activity_logs").insert({
    actor_id: identity.id,
    entity_type: entityType,
    entity_id: entityId,
    action,
    details,
  });
}

function refreshCrm() {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

function ownerOnly(role: string) {
  if (role !== "OWNER") throw new Error("Only an Owner can make that change.");
}

export async function saveCrmRecord(input: CrmMutation): Promise<ActionResult> {
  const parsed = mutationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The submitted CRM record is invalid." };

  try {
    const { resource, id, values } = parsed.data;
    const identity = await requireAdmin();
    const supabase = await createSupabaseServerClient();
    let result: { data: { id: string } | null; error: { message: string } | null } | null = null;

    if (resource === "inquiries") {
      if (!id) throw new Error("An inquiry must be selected.");
      const status = z.enum(INQUIRY_STATUSES).parse(values.status);
      const internalNotes = optionalText(values, "internal_notes");

      if (identity.role === "STAFF") {
        const { error } = await supabase.rpc("staff_update_inquiry", {
          target_inquiry: id,
          next_status: status,
          next_internal_notes: internalNotes,
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("inquiries").update({
          status,
          internal_notes: internalNotes,
          client_id: optionalUuid(values, "client_id"),
          project_id: optionalUuid(values, "project_id"),
        }).eq("id", id);
        if (error) throw new Error(error.message);
      }

      await logActivity("inquiry", id, "updated", { status });
      refreshCrm();
      return { ok: true, message: "Inquiry updated." };
    }

    if (resource === "clients") {
      ownerOnly(identity.role);
      const payload = {
        company_name: requiredText(values, "company_name", 200),
        contact_name: optionalText(values, "contact_name", 160),
        email: optionalText(values, "email", 254),
        phone: optionalText(values, "phone", 80),
        notes: optionalText(values, "notes"),
      };
      result = id
        ? await supabase.from("clients").update(payload).eq("id", id).select("id").single()
        : await supabase.from("clients").insert(payload).select("id").single();
    }

    if (resource === "projects") {
      if (identity.role === "STAFF") {
        if (!id) throw new Error("Staff can only update assigned projects.");
        const { error } = await supabase.rpc("staff_update_project_progress", {
          target_project: id,
          next_status: z.enum(PROJECT_STATUSES).parse(values.status),
          next_progress: integer(values, "progress", 0, 100),
        });
        if (error) throw new Error(error.message);
        await logActivity("project", id, "progress_updated", { status: values.status, progress: values.progress });
        refreshCrm();
        return { ok: true, message: "Project progress updated." };
      }

      const payload = {
        name: requiredText(values, "name", 200),
        description: optionalText(values, "description"),
        client_id: optionalUuid(values, "client_id"),
        status: z.enum(PROJECT_STATUSES).parse(values.status),
        progress: integer(values, "progress", 0, 100),
        start_date: dateOrNull(values, "start_date"),
        due_date: dateOrNull(values, "due_date"),
        completed_at: values.status === "COMPLETED" ? new Date().toISOString() : null,
        ...(id ? {} : { created_by: identity.id }),
      };
      result = id
        ? await supabase.from("projects").update(payload).eq("id", id).select("id").single()
        : await supabase.from("projects").insert(payload).select("id").single();

      if (!result.error && result.data) {
        const memberIds = Array.isArray(values.member_ids) ? values.member_ids.filter((value): value is string => typeof value === "string" && z.uuid().safeParse(value).success) : [];
        await supabase.from("project_members").delete().eq("project_id", result.data.id);
        if (memberIds.length) {
          const { error } = await supabase.from("project_members").insert(memberIds.map((profileId) => ({ project_id: result!.data!.id, profile_id: profileId })));
          if (error) throw new Error(error.message);
        }
      }
    }

    if (resource === "tasks") {
      if (identity.role === "STAFF") {
        if (!id) throw new Error("Staff can only update assigned tasks.");
        const status = z.enum(TASK_STATUSES).parse(values.status);
        const { error } = await supabase.rpc("staff_update_task_status", { target_task: id, next_status: status });
        if (error) throw new Error(error.message);
        await logActivity("task", id, "status_updated", { status });
        refreshCrm();
        return { ok: true, message: "Task status updated." };
      }

      const status = z.enum(TASK_STATUSES).parse(values.status);
      const payload = {
        project_id: z.uuid().parse(values.project_id),
        title: requiredText(values, "title", 200),
        description: optionalText(values, "description"),
        assignee_id: optionalUuid(values, "assignee_id"),
        status,
        due_date: dateOrNull(values, "due_date"),
        completed_at: status === "DONE" ? new Date().toISOString() : null,
      };
      result = id
        ? await supabase.from("tasks").update(payload).eq("id", id).select("id").single()
        : await supabase.from("tasks").insert(payload).select("id").single();
    }

    if (resource === "services") {
      ownerOnly(identity.role);
      const payload = {
        slug: slug(values, "slug"),
        title: requiredText(values, "title", 120),
        description: requiredText(values, "description", 500),
        icon_name: requiredText(values, "icon_name", 80),
        sort_order: integer(values, "sort_order", 0, 1000),
        is_published: flag(values, "is_published"),
      };
      result = id
        ? await supabase.from("services").update(payload).eq("id", id).select("id").single()
        : await supabase.from("services").insert(payload).select("id").single();
    }

    if (resource === "portfolio") {
      ownerOnly(identity.role);
      const technologies = (optionalText(values, "technologies", 1_000) ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);
      const payload = {
        slug: slug(values, "slug"),
        title: requiredText(values, "title", 180),
        category: requiredText(values, "category", 120),
        summary: requiredText(values, "summary", 700),
        image_url: optionalText(values, "image_url", 2_000),
        image_public_id: optionalText(values, "image_public_id", 300),
        project_url: optionalText(values, "project_url", 2_000),
        technologies,
        project_date: optionalText(values, "project_date", 80),
        asset_size: optionalText(values, "asset_size", 40),
        source_image_path: optionalText(values, "source_image_path", 500),
        is_published: flag(values, "is_published"),
        is_featured: flag(values, "is_featured"),
        sort_order: integer(values, "sort_order", 0, 1000),
        published_at: flag(values, "is_published") ? new Date().toISOString() : null,
      };
      result = id
        ? await supabase.from("portfolio_projects").update(payload).eq("id", id).select("id").single()
        : await supabase.from("portfolio_projects").insert(payload).select("id").single();
    }

    if (resource === "employees") {
      ownerOnly(identity.role);
      if (!id) throw new Error("An employee must be selected.");
      const { error } = await supabase.from("profiles").update({
        full_name: requiredText(values, "full_name", 160),
        job_title: optionalText(values, "job_title", 160),
        is_active: flag(values, "is_active"),
      }).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity("profile", id, "updated");
      refreshCrm();
      return { ok: true, message: "Employee updated." };
    }

    if (!result) throw new Error("Unsupported CRM resource.");
    if (result.error) throw new Error(result.error.message);

    await logActivity(resource, result.data?.id ?? id ?? null, id ? "updated" : "created");
    refreshCrm();
    return { ok: true, message: `${resource.slice(0, -1)} ${id ? "updated" : "created"}.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save this record." };
  }
}

export async function deleteCrmRecord(resource: Exclude<CrmResource, "inquiries" | "employees">, id: string): Promise<ActionResult> {
  try {
    z.uuid().parse(id);
    const identity = await requireAdmin();
    ownerOnly(identity.role);
    const table = ({ clients: "clients", projects: "projects", tasks: "tasks", services: "services", portfolio: "portfolio_projects" } as const)[resource];
    if (!table) throw new Error("This record cannot be deleted here.");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw new Error(error.message);
    await logActivity(resource, id, "deleted");
    refreshCrm();
    return { ok: true, message: "Record deleted." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to delete this record." };
  }
}

export async function convertInquiry(inquiryId: string): Promise<ActionResult> {
  try {
    z.uuid().parse(inquiryId);
    const identity = await requireAdmin();
    ownerOnly(identity.role);
    const supabase = await createSupabaseServerClient();
    const { data: inquiry, error: inquiryError } = await supabase.from("inquiries").select("id, name, email, description, client_id, project_id").eq("id", inquiryId).single();
    if (inquiryError || !inquiry) throw new Error(inquiryError?.message ?? "Inquiry not found.");
    if (inquiry.project_id) throw new Error("This inquiry has already been converted.");

    let clientId = inquiry.client_id;
    if (!clientId) {
      const { data: client, error } = await supabase.from("clients").insert({
        company_name: inquiry.name,
        contact_name: inquiry.name,
        email: inquiry.email,
      }).select("id").single();
      if (error || !client) throw new Error(error?.message ?? "Unable to create client.");
      clientId = client.id;
    }

    const { data: project, error: projectError } = await supabase.from("projects").insert({
      client_id: clientId,
      inquiry_id: inquiry.id,
      name: `${inquiry.name} project`,
      description: inquiry.description,
      status: "LEAD",
      created_by: identity.id,
    }).select("id").single();
    if (projectError || !project) throw new Error(projectError?.message ?? "Unable to create project.");

    const { error: updateError } = await supabase.from("inquiries").update({
      status: "CONVERTED",
      client_id: clientId,
      project_id: project.id,
    }).eq("id", inquiry.id);
    if (updateError) throw new Error(updateError.message);

    await logActivity("inquiry", inquiry.id, "converted", { clientId, projectId: project.id });
    refreshCrm();
    return { ok: true, message: "Inquiry converted into a client and project." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to convert inquiry." };
  }
}

export async function updateCompanySettings(values: Record<string, unknown>): Promise<ActionResult> {
  try {
    const identity = await requireAdmin();
    ownerOnly(identity.role);
    const email = requiredText(values, "company_email", 254);
    z.email().parse(email);
    const socialLinks = {
      facebook: optionalText(values, "facebook", 2_000) ?? "",
      instagram: optionalText(values, "instagram", 2_000) ?? "",
      linkedin: optionalText(values, "linkedin", 2_000) ?? "",
    };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("company_settings").update({
      company_name: requiredText(values, "company_name", 160),
      company_email: email,
      location: optionalText(values, "location", 200),
      logo_url: optionalText(values, "logo_url", 2_000),
      favicon_url: optionalText(values, "favicon_url", 2_000),
      social_links: socialLinks,
      updated_by: identity.id,
    }).eq("id", true);
    if (error) throw new Error(error.message);
    await logActivity("company_settings", null, "updated");
    refreshCrm();
    return { ok: true, message: "Company settings published." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update company settings." };
  }
}

export async function inviteStaff(values: { email: string; fullName: string; jobTitle?: string }): Promise<ActionResult> {
  try {
    const identity = await requireAdmin();
    ownerOnly(identity.role);
    const email = z.email().parse(values.email.trim());
    const fullName = z.string().trim().min(2).max(160).parse(values.fullName);
    const jobTitle = z.string().trim().max(160).optional().parse(values.jobTitle)?.trim() || null;
    const admin = createSupabaseAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: appUrl ? `${appUrl.replace(/\/$/, "")}/auth/callback` : undefined,
    });
    if (error || !data.user) throw new Error(error?.message ?? "Unable to invite this user.");

    const { error: profileError } = await admin.from("profiles").update({
      full_name: fullName,
      job_title: jobTitle,
      role: "STAFF",
      is_active: true,
    }).eq("id", data.user.id);
    if (profileError) throw new Error(profileError.message);
    await logActivity("profile", data.user.id, "staff_invited", { email });
    refreshCrm();
    return { ok: true, message: `Invitation sent to ${email}.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to invite this team member." };
  }
}

export async function setUserRole(profileId: string, role: "OWNER" | "STAFF"): Promise<ActionResult> {
  try {
    z.uuid().parse(profileId);
    const identity = await requireAdmin();
    ownerOnly(identity.role);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
    if (error) throw new Error(error.message);
    await logActivity("profile", profileId, "role_updated", { role });
    refreshCrm();
    return { ok: true, message: "User role updated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update the role." };
  }
}
