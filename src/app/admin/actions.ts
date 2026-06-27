"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireAdmin, requireModuleAccess } from "@/lib/crm/auth";
import { ADMIN_MODULES, CONTENT_STATUSES, INQUIRY_STATUSES, LEAD_OUTCOMES, PROJECT_STATUSES, PROJECT_TYPES, TASK_STATUSES } from "@/lib/crm/constants";
import { clearPublicSiteDataCache } from "@/lib/crm/public-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { fetchWithSupabaseTimeout } from "@/lib/supabase/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const resourceSchema = z.enum(["inquiries", "clients", "projects", "tasks", "services", "employees"]);
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

function uuidArray(values: Record<string, unknown>, key: string) {
  const value = values[key];
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string =>
    typeof item === "string" && z.uuid().safeParse(item).success,
  );
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
  clearPublicSiteDataCache();
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

function ownerOnly(role: string) {
  if (role !== "ADMIN") throw new Error("Only an Admin can make that change.");
}

function authPasswordSetupUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL;
  return appUrl ? new URL("/auth/set-password", appUrl).toString() : undefined;
}

function appUrl(path: string) {
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL;
  const base =
    process.env.NODE_ENV === "development" &&
    configuredBase &&
    !configuredBase.includes("localhost") &&
    !configuredBase.includes("127.0.0.1")
      ? "http://localhost:3000"
      : configuredBase;
  return base ? new URL(path, base).toString() : path;
}

function allowedPermissions(values: unknown) {
  const allowed = new Set(ADMIN_MODULES.map((module) => module.key));
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string" && allowed.has(value as never))
    : [];
}

const contentMediaAssetSchema = z.object({
  id: z.string().min(1).max(120),
  url: z.url().max(2_000),
  publicId: z.string().max(300).nullable(),
  provider: z.enum(["cloudinary", "external"]).default("cloudinary"),
  mimeType: z.string().max(120).nullable(),
  fileName: z.string().max(220).nullable(),
  alt: z.string().max(180).nullable(),
});

function contentMediaAssets(values: Record<string, unknown>) {
  const assets = values.media_assets;
  if (!Array.isArray(assets)) return [];
  return assets
    .map((asset) => contentMediaAssetSchema.safeParse(asset))
    .filter((result): result is z.ZodSafeParseSuccess<z.infer<typeof contentMediaAssetSchema>> => result.success)
    .map((result) => result.data)
    .slice(0, 10);
}

function facebookPageConfig() {
  const pageId =
    process.env.META_PAGE_ID ??
    process.env.FACEBOOK_PAGE_ID ??
    process.env.FB_PAGE_ID ??
    "";
  const pageAccessToken =
    process.env.META_PAGE_ACCESS_TOKEN ??
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN ??
    process.env.FB_PAGE_ACCESS_TOKEN ??
    "";
  const graphVersion = process.env.META_GRAPH_VERSION ?? "v21.0";

  return { pageId, pageAccessToken, graphVersion };
}

async function facebookGraphPost<T>(path: string, body: Record<string, string>): Promise<T> {
  const { pageAccessToken, graphVersion } = facebookPageConfig();
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${path}`);
  const formData = new URLSearchParams({ ...body, access_token: pageAccessToken });
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  const result = await response.json() as T & { error?: { message?: string; type?: string; code?: number } };

  if (!response.ok || result.error) {
    throw new Error(result.error?.message ?? "Facebook Graph API request failed.");
  }

  return result;
}

async function sendAccountNotice({
  to,
  name,
  subject,
  message,
}: {
  to: string;
  name: string;
  subject: string;
  message: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) return;

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: process.env.SMTP_SECURE !== "false",
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from: `"Creatiq CRM" <${smtpUser}>`,
      to,
      subject,
      text: `Hi ${name},\n\n${message}\n\nIf you believe this was a mistake, please contact a Creatiq Admin.`,
      html: `<div style="font-family:Inter,Arial,sans-serif;background:#020b1f;padding:28px;color:#e8f1ff"><div style="max-width:560px;margin:auto;border:1px solid rgba(8,189,255,.25);border-radius:22px;background:#061329;padding:26px"><p style="margin:0 0 12px;color:#08bdff;font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:800">Creatiq CRM Access Notice</p><h1 style="margin:0 0 14px;color:#ffffff;font-size:26px">Account access updated</h1><p style="margin:0 0 14px;line-height:1.7;color:#c8d4ec">Hi ${name},</p><p style="margin:0;line-height:1.7;color:#c8d4ec">${message}</p><div style="margin-top:22px;padding:14px;border-radius:14px;background:rgba(8,189,255,.08);color:#9ee8ff;font-size:13px">If you believe this was a mistake, please contact a Creatiq Admin.</div></div></div>`,
    });
  } catch (error) {
    console.error("Unable to send account notice:", error);
  }
}

async function createAdminSecurityRequest({
  action,
  targetProfileId,
  requestedBy,
  requestedRole,
  details = {},
}: {
  action: "DEACTIVATE_ADMIN" | "CHANGE_ADMIN_ROLE";
  targetProfileId: string;
  requestedBy: string;
  requestedRole?: "ADMIN" | "STAFF" | null;
  details?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("admin_security_requests")
    .update({ status: "EXPIRED" })
    .eq("target_profile_id", targetProfileId)
    .eq("action", action)
    .eq("status", "PENDING");

  const { data, error } = await admin
    .from("admin_security_requests")
    .insert({
      action,
      target_profile_id: targetProfileId,
      requested_by: requestedBy,
      requested_role: requestedRole ?? null,
      details,
    })
    .select("request_token")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to create confirmation request.");
  return String(data.request_token);
}

async function sendAdminConfirmationEmail({
  to,
  name,
  action,
  token,
  requestedRole,
}: {
  to: string;
  name: string;
  action: "DEACTIVATE_ADMIN" | "CHANGE_ADMIN_ROLE";
  token: string;
  requestedRole?: "ADMIN" | "STAFF" | null;
}) {
  const link = appUrl(`/admin/security-confirm/${token}`);
  const actionText =
    action === "DEACTIVATE_ADMIN"
      ? "deactivate your Admin account"
      : `change your core security level to ${requestedRole}`;
  await sendAccountNotice({
    to,
    name,
    subject: "Creatiq CRM admin confirmation required",
    message: `An Admin requested to ${actionText}. For security, this will not apply until you confirm it using your own password. Confirmation link: ${link}`,
  });
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

      const serviceIds = uuidArray(values, "service_ids");
      const payload = {
        slug: optionalText(values, "slug", 100)?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || null,
        name: requiredText(values, "name", 200),
        description: optionalText(values, "description"),
        service_id: serviceIds[0] ?? optionalUuid(values, "service_id"),
        client_id: optionalUuid(values, "client_id"),
        category: optionalText(values, "category", 120),
        project_type: z.enum(PROJECT_TYPES).parse(values.project_type ?? "CLIENT"),
        lead_outcome: z.enum(LEAD_OUTCOMES).parse(values.lead_outcome ?? "OPEN"),
        lost_reason: optionalText(values, "lost_reason", 700),
        status: z.enum(PROJECT_STATUSES).parse(values.status),
        progress: integer(values, "progress", 0, 100),
        start_date: dateOrNull(values, "start_date"),
        due_date: dateOrNull(values, "due_date"),
        completed_at: values.status === "COMPLETED" ? new Date().toISOString() : null,
        won_at: values.lead_outcome === "WON" ? new Date().toISOString() : null,
        lost_at: values.lead_outcome === "LOST" ? new Date().toISOString() : null,
        is_published: flag(values, "is_published"),
        is_featured: flag(values, "is_featured"),
        image_url: optionalText(values, "image_url", 2_000),
        image_public_id: optionalText(values, "image_public_id", 300),
        project_url: optionalText(values, "project_url", 2_000),
        technologies: (optionalText(values, "technologies", 1_000) ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20),
        project_date: optionalText(values, "project_date", 80),
        asset_size: optionalText(values, "asset_size", 40),
        source_image_path: optionalText(values, "source_image_path", 500),
        sort_order: integer(values, "sort_order", 0, 1000),
        published_at: flag(values, "is_published") ? new Date().toISOString() : null,
        ...(id ? {} : { created_by: identity.id }),
      };
      result = id
        ? await supabase.from("projects").update(payload).eq("id", id).select("id").single()
        : await supabase.from("projects").insert(payload).select("id").single();

      if (!result.error && result.data) {
        await supabase.from("project_services").delete().eq("project_id", result.data.id);
        if (serviceIds.length) {
          const { error } = await supabase.from("project_services").insert(
            serviceIds.map((serviceId) => ({
              project_id: result!.data!.id,
              service_id: serviceId,
            })),
          );
          if (error) throw new Error(error.message);
        }

        const memberIds = Array.isArray(values.member_ids) ? values.member_ids.filter((value): value is string => typeof value === "string" && z.uuid().safeParse(value).success) : [];
        await supabase.from("project_members").delete().eq("project_id", result.data.id);
        await supabase.from("project_contributors").delete().eq("project_id", result.data.id).not("profile_id", "is", null);
        if (memberIds.length) {
          const { error } = await supabase.from("project_members").insert(memberIds.map((profileId) => ({ project_id: result!.data!.id, profile_id: profileId })));
          if (error) throw new Error(error.message);
          const { error: contributorError } = await supabase.from("project_contributors").insert(memberIds.map((profileId) => ({ project_id: result!.data!.id, profile_id: profileId, contribution_role: "Employee" })));
          if (contributorError) throw new Error(contributorError.message);
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

    if (resource === "employees") {
      ownerOnly(identity.role);
      if (!id) throw new Error("An employee must be selected.");
      const nextActive = flag(values, "is_active");
      if (id === identity.id && !nextActive) throw new Error("You cannot deactivate your own account.");
      const { data: targetProfile, error: targetProfileError } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", id)
        .single();
      if (targetProfileError || !targetProfile) throw new Error(targetProfileError?.message ?? "Employee profile not found.");
      if (targetProfile.role === "ADMIN" && !nextActive && !flag(values, "confirm_co_admin_inactivation")) {
        throw new Error("Confirm that you want to deactivate this co-admin account first.");
      }
      const { error } = await supabase.from("profiles").update({
        full_name: requiredText(values, "full_name", 160),
        job_title: optionalText(values, "job_title", 160),
        is_active: nextActive,
      }).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity("profile", id, nextActive ? "updated" : "deactivated", { email: targetProfile.email, role: targetProfile.role });
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
    const table = ({ clients: "clients", projects: "projects", tasks: "tasks", services: "services" } as const)[resource];
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

export async function inviteStaff(values: { email: string; fullName: string; jobTitle?: string; role?: "ADMIN" | "STAFF"; accessRoleId?: string | null }): Promise<ActionResult> {
  try {
    const identity = await requireAdmin();
    ownerOnly(identity.role);
    const email = z.email().parse(values.email.trim());
    const fullName = z.string().trim().min(2).max(160).parse(values.fullName);
    const jobTitle = z.string().trim().max(160).optional().parse(values.jobTitle)?.trim() || null;
    const role = values.role === "ADMIN" ? "ADMIN" : "STAFF";
    const accessRoleId = role === "STAFF" && values.accessRoleId ? z.uuid().parse(values.accessRoleId) : null;
    const admin = createSupabaseAdminClient();
    const redirectTo = authPasswordSetupUrl();

    const { data: existingProfile, error: existingProfileError } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingProfileError) throw new Error(existingProfileError.message);

    if (existingProfile) {
      const { error: resetError } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw new Error(resetError.message);
      await logActivity("profile", existingProfile.id, "password_setup_resent", { email });
      return { ok: true, message: `A fresh password setup link was sent to ${email}.` };
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo,
    });
    if (error || !data.user) throw new Error(error?.message ?? "Unable to invite this user.");

    const { error: profileError } = await admin.from("profiles").update({
      full_name: fullName,
      job_title: jobTitle,
      role,
      access_role_id: accessRoleId,
      is_active: true,
    }).eq("id", data.user.id);
    if (profileError) throw new Error(profileError.message);
    await logActivity("profile", data.user.id, "user_invited", { email, role, accessRoleId });
    refreshCrm();
    return { ok: true, message: `Invitation sent to ${email}.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to invite this team member." };
  }
}

export async function setUserRole(profileId: string, role: "ADMIN" | "STAFF"): Promise<ActionResult> {
  try {
    z.uuid().parse(profileId);
    const identity = await requireAdmin();
    ownerOnly(identity.role);
    if (profileId === identity.id) throw new Error("You cannot change your own Admin role. Another Admin can do that.");
    const supabase = await createSupabaseServerClient();
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", profileId)
      .single();
    if (targetProfileError || !targetProfile) throw new Error(targetProfileError?.message ?? "User profile not found.");

    if (targetProfile.role === "ADMIN" && role !== targetProfile.role) {
      const token = await createAdminSecurityRequest({
        action: "CHANGE_ADMIN_ROLE",
        targetProfileId: profileId,
        requestedBy: identity.id,
        requestedRole: role,
        details: { from: targetProfile.role, to: role },
      });
      await sendAdminConfirmationEmail({
        to: targetProfile.email,
        name: targetProfile.full_name,
        action: "CHANGE_ADMIN_ROLE",
        token,
        requestedRole: role,
      });
      await logActivity("profile", profileId, "role_change_confirmation_requested", { role });
      refreshCrm();
      return { ok: true, message: `Confirmation link sent to ${targetProfile.full_name}. Their role will change after they confirm with their password.` };
    }

    const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
    if (error) throw new Error(error.message);
    await logActivity("profile", profileId, "role_updated", { role });
    if (targetProfile.role === "ADMIN" || role === "ADMIN") {
      await sendAccountNotice({
        to: targetProfile.email,
        name: targetProfile.full_name,
        subject: "Creatiq CRM role updated",
        message: `Your Creatiq CRM access role was changed from ${targetProfile.role} to ${role}.`,
      });
    }
    refreshCrm();
    return { ok: true, message: "User role updated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update the role." };
  }
}

export async function setUserActive(profileId: string, isActive: boolean, _confirmedCoAdmin = false): Promise<ActionResult> {
  try {
    void _confirmedCoAdmin;
    z.uuid().parse(profileId);
    const identity = await requireAdmin();
    ownerOnly(identity.role);
    if (profileId === identity.id && !isActive) throw new Error("You cannot deactivate your own account.");

    const supabase = await createSupabaseServerClient();
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from("profiles")
      .select("role, full_name, email, is_active")
      .eq("id", profileId)
      .single();
    if (targetProfileError || !targetProfile) throw new Error(targetProfileError?.message ?? "User profile not found.");
    if (targetProfile.role === "ADMIN" && !isActive) {
      const token = await createAdminSecurityRequest({
        action: "DEACTIVATE_ADMIN",
        targetProfileId: profileId,
        requestedBy: identity.id,
        details: { previousActive: targetProfile.is_active },
      });
      await sendAdminConfirmationEmail({
        to: targetProfile.email,
        name: targetProfile.full_name,
        action: "DEACTIVATE_ADMIN",
        token,
      });
      await logActivity("profile", profileId, "deactivation_confirmation_requested", { email: targetProfile.email });
      refreshCrm();
      return { ok: true, message: `Confirmation link sent to ${targetProfile.full_name}. The account stays active until they confirm with their password.` };
    }

    const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", profileId);
    if (error) throw new Error(error.message);
    await logActivity("profile", profileId, isActive ? "activated" : "deactivated", {
      email: targetProfile.email,
      role: targetProfile.role,
    });
    if (targetProfile.role === "ADMIN") {
      await sendAccountNotice({
        to: targetProfile.email,
        name: targetProfile.full_name,
        subject: `Creatiq CRM account ${isActive ? "activated" : "deactivated"}`,
        message: `Your Creatiq CRM admin account has been ${isActive ? "activated" : "deactivated"}. ${isActive ? "You can sign in again using your existing credentials." : "You will not be able to sign in until another Admin reactivates your account."}`,
      });
    }
    refreshCrm();
    return { ok: true, message: `${targetProfile.full_name} is now ${isActive ? "active" : "inactive"}.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update account access." };
  }
}

export async function setUserAccessRole(profileId: string, accessRoleId: string | null): Promise<ActionResult> {
  try {
    z.uuid().parse(profileId);
    const identity = await requireAdmin(["ADMIN"]);
    if (profileId === identity.id) throw new Error("You cannot change your own access configuration.");
    const supabase = await createSupabaseServerClient();
    const nextRoleId = accessRoleId ? z.uuid().parse(accessRoleId) : null;
    const { error } = await supabase.from("profiles").update({ access_role_id: nextRoleId }).eq("id", profileId);
    if (error) throw new Error(error.message);
    await logActivity("profile", profileId, "access_role_updated", { accessRoleId: nextRoleId });
    refreshCrm();
    return { ok: true, message: "User access role updated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update access role." };
  }
}

export async function saveAccessRole(values: { id?: string; name: string; description?: string; permissions: string[] }): Promise<ActionResult> {
  try {
    const identity = await requireAdmin(["ADMIN"]);
    const payload = {
      name: z.string().trim().min(2).max(120).parse(values.name),
      description: values.description?.trim().slice(0, 700) || null,
      permissions: allowedPermissions(values.permissions),
      created_by: identity.id,
    };
    const supabase = await createSupabaseServerClient();
    const id = values.id ? z.uuid().parse(values.id) : null;
    const result = id
      ? await supabase.from("access_roles").update({ name: payload.name, description: payload.description, permissions: payload.permissions }).eq("id", id).select("id").single()
      : await supabase.from("access_roles").insert(payload).select("id").single();
    if (result.error || !result.data) throw new Error(result.error?.message ?? "Unable to save access role.");
    await logActivity("access_role", result.data.id, id ? "updated" : "created", { name: payload.name });
    refreshCrm();
    return { ok: true, message: `Access role ${id ? "updated" : "created"}.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save access role." };
  }
}

export async function deleteAccessRole(id: string): Promise<ActionResult> {
  try {
    z.uuid().parse(id);
    await requireAdmin(["ADMIN"]);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("access_roles").delete().eq("id", id).eq("is_system", false);
    if (error) throw new Error(error.message);
    await logActivity("access_role", id, "deleted");
    refreshCrm();
    return { ok: true, message: "Access role deleted." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to delete access role." };
  }
}

export async function confirmAdminSecurityRequest(token: string, password: string): Promise<ActionResult> {
  try {
    const requestToken = z.uuid().parse(token);
    if (!password) throw new Error("Enter your password to confirm this request.");

    const admin = createSupabaseAdminClient();
    const { data: request, error: requestError } = await admin
      .from("admin_security_requests")
      .select("id, action, target_profile_id, requested_role, status, expires_at")
      .eq("request_token", requestToken)
      .single();
    if (requestError || !request) throw new Error(requestError?.message ?? "Confirmation request not found.");
    if (request.status !== "PENDING") throw new Error("This confirmation request is no longer pending.");
    if (new Date(request.expires_at).getTime() < Date.now()) {
      await admin.from("admin_security_requests").update({ status: "EXPIRED" }).eq("id", request.id);
      throw new Error("This confirmation link has expired. Ask another Admin to send a new request.");
    }

    const { data: targetProfile, error: targetError } = await admin
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", request.target_profile_id)
      .single();
    if (targetError || !targetProfile) throw new Error(targetError?.message ?? "Admin profile not found.");

    const { url, publishableKey } = getSupabaseConfig();
    const verifier = createClient(url, publishableKey, {
      global: { fetch: fetchWithSupabaseTimeout },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    const { error: signInError } = await verifier.auth.signInWithPassword({
      email: targetProfile.email,
      password,
    });
    if (signInError) throw new Error("Password confirmation failed. Please check your password and try again.");
    await verifier.auth.signOut();

    if (request.action === "DEACTIVATE_ADMIN") {
      const { error } = await admin.from("profiles").update({ is_active: false }).eq("id", targetProfile.id);
      if (error) throw new Error(error.message);
    } else if (request.action === "CHANGE_ADMIN_ROLE") {
      const nextRole = z.enum(["ADMIN", "STAFF"]).parse(request.requested_role);
      const { error } = await admin.from("profiles").update({ role: nextRole }).eq("id", targetProfile.id);
      if (error) throw new Error(error.message);
    }

    await admin
      .from("admin_security_requests")
      .update({ status: "CONFIRMED", confirmed_at: new Date().toISOString() })
      .eq("id", request.id);
    await admin.from("activity_logs").insert({
      actor_id: targetProfile.id,
      entity_type: "admin_security_request",
      entity_id: request.id,
      action: request.action.toLowerCase(),
      details: { targetProfileId: targetProfile.id },
    });
    refreshCrm();
    return { ok: true, message: "Security request confirmed. The requested access change has been applied." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to confirm this request." };
  }
}

export async function saveContentPlannerItem(values: Record<string, unknown>, id?: string): Promise<ActionResult> {
  try {
    const identity = await requireModuleAccess("content-planner");
    const supabase = await createSupabaseServerClient();
    const payload = {
      title: requiredText(values, "title", 180),
      channel: requiredText(values, "channel", 80),
      content_type: requiredText(values, "content_type", 80),
      status: z.enum(CONTENT_STATUSES).parse(values.status ?? "IDEA"),
      planned_for: dateOrNull(values, "planned_for") ?? new Date().toISOString().slice(0, 10),
      description: optionalText(values, "description", 2_000),
      owner_id: optionalUuid(values, "owner_id"),
      project_id: optionalUuid(values, "project_id"),
      service_id: optionalUuid(values, "service_id"),
      media_assets: contentMediaAssets(values),
      automation_metadata: {
        caption_format: "facebook_plain_text_v1",
        supports_unicode_styling: true,
        hashtags_are_native: true,
      },
      ...(id ? {} : { created_by: identity.id }),
    };
    const parsedId = id ? z.uuid().parse(id) : null;
    const result = parsedId
      ? await supabase.from("content_planner_items").update(payload).eq("id", parsedId).select("id").single()
      : await supabase.from("content_planner_items").insert(payload).select("id").single();
    if (result.error || !result.data) throw new Error(result.error?.message ?? "Unable to save content item.");
    await logActivity("content_planner", result.data.id, parsedId ? "updated" : "created", { title: payload.title, planned_for: payload.planned_for });
    refreshCrm();
    return { ok: true, message: `Content item ${parsedId ? "updated" : "created"}.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save content item." };
  }
}

export async function deleteContentPlannerItem(id: string): Promise<ActionResult> {
  try {
    z.uuid().parse(id);
    await requireModuleAccess("content-planner", ["ADMIN"]);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("content_planner_items").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await logActivity("content_planner", id, "deleted");
    refreshCrm();
    return { ok: true, message: "Content item deleted." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to delete content item." };
  }
}

export async function publishContentPlannerItemToFacebook(id: string): Promise<ActionResult> {
  try {
    const identity = await requireModuleAccess("content-planner", ["ADMIN"]);
    const contentId = z.uuid().parse(id);
    const { pageId, pageAccessToken } = facebookPageConfig();

    if (!pageId || !pageAccessToken) {
      throw new Error("Facebook Page posting is not configured. Add META_PAGE_ID and META_PAGE_ACCESS_TOKEN to .env.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: item, error } = await supabase
      .from("content_planner_items")
      .select("id, title, description, media_assets, automation_metadata")
      .eq("id", contentId)
      .single();

    if (error || !item) throw new Error(error?.message ?? "Content planner item was not found.");

    const message = String(item.description || item.title || "").trim();
    if (!message) throw new Error("Add a caption or title before posting to Facebook.");

    const mediaAssets = Array.isArray(item.media_assets)
      ? item.media_assets.flatMap((asset) => {
          if (!asset || typeof asset !== "object") return [];
          const candidate = asset as { url?: unknown };
          return typeof candidate.url === "string" && candidate.url ? [{ url: candidate.url }] : [];
        })
      : [];

    let facebookPostId = "";
    let publishMode: "feed" | "photo" | "multi_photo" = "feed";

    if (mediaAssets.length === 0) {
      const result = await facebookGraphPost<{ id: string }>(`${pageId}/feed`, {
        message,
      });
      facebookPostId = result.id;
    } else if (mediaAssets.length === 1) {
      publishMode = "photo";
      const result = await facebookGraphPost<{ id: string; post_id?: string }>(`${pageId}/photos`, {
        url: mediaAssets[0].url,
        caption: message,
        published: "true",
      });
      facebookPostId = result.post_id ?? result.id;
    } else {
      publishMode = "multi_photo";
      const uploaded = await Promise.all(
        mediaAssets.slice(0, 10).map((asset) =>
          facebookGraphPost<{ id: string }>(`${pageId}/photos`, {
            url: asset.url,
            published: "false",
          }),
        ),
      );

      const body: Record<string, string> = { message };
      uploaded.forEach((upload, index) => {
        body[`attached_media[${index}]`] = JSON.stringify({ media_fbid: upload.id });
      });

      const result = await facebookGraphPost<{ id: string }>(`${pageId}/feed`, body);
      facebookPostId = result.id;
    }

    const automationMetadata =
      item.automation_metadata && typeof item.automation_metadata === "object" && !Array.isArray(item.automation_metadata)
        ? item.automation_metadata as Record<string, unknown>
        : {};

    const { error: updateError } = await supabase
      .from("content_planner_items")
      .update({
        status: "PUBLISHED",
        automation_metadata: {
          ...automationMetadata,
          facebook: {
            post_id: facebookPostId,
            page_id: pageId,
            mode: publishMode,
            media_count: mediaAssets.length,
            published_at: new Date().toISOString(),
            published_by: identity.id,
          },
        },
      })
      .eq("id", contentId);

    if (updateError) throw new Error(updateError.message);

    await logActivity("content_planner", contentId, "facebook_published", {
      postId: facebookPostId,
      mediaCount: mediaAssets.length,
    });
    refreshCrm();
    return { ok: true, message: `Posted to Facebook Page. Post ID: ${facebookPostId}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to publish to Facebook." };
  }
}

export async function updateMyProfile(values: { fullName: string; jobTitle?: string }): Promise<ActionResult> {
  try {
    const identity = await requireAdmin();
    const fullName = z.string().trim().min(2).max(160).parse(values.fullName);
    const jobTitle = z.string().trim().max(160).optional().parse(values.jobTitle)?.trim() || null;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      job_title: jobTitle,
    }).eq("id", identity.id);
    if (error) throw new Error(error.message);
    await logActivity("profile", identity.id, "profile_updated");
    refreshCrm();
    return { ok: true, message: "Profile updated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update your profile." };
  }
}

export async function saveExternalContributor(values: { projectId: string; name: string; email?: string; role?: string }): Promise<ActionResult> {
  try {
    const identity = await requireAdmin(["ADMIN"]);
    const projectId = z.uuid().parse(values.projectId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("project_contributors").insert({
      project_id: projectId,
      external_name: z.string().trim().min(2).max(160).parse(values.name),
      external_email: values.email ? z.email().parse(values.email.trim()) : null,
      contribution_role: values.role?.trim().slice(0, 120) || "External contributor",
    }).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Unable to add contributor.");
    await logActivity("project_contributor", data.id, "external_contributor_added", { projectId, actor: identity.id });
    refreshCrm();
    return { ok: true, message: "External contributor added." };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to add contributor." }; }
}

export async function removeProjectContributor(id: string): Promise<ActionResult> {
  try {
    z.uuid().parse(id);
    await requireAdmin(["ADMIN"]);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("project_contributors").delete().eq("id", id).is("profile_id", null);
    if (error) throw new Error(error.message);
    await logActivity("project_contributor", id, "external_contributor_removed");
    refreshCrm();
    return { ok: true, message: "External contributor removed." };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to remove contributor." }; }
}

export async function createReviewRequest(values: { projectId?: string; clientId?: string; recipientName?: string; recipientEmail: string }): Promise<ActionResult & { token?: string }> {
  try {
    const identity = await requireAdmin(["ADMIN"]);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("customer_reviews").insert({
      project_id: values.projectId ? z.uuid().parse(values.projectId) : null,
      client_id: values.clientId ? z.uuid().parse(values.clientId) : null,
      recipient_name: values.recipientName?.trim().slice(0, 120) || null,
      recipient_email: z.email().parse(values.recipientEmail.trim()),
      requested_by: identity.id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    }).select("request_token, id").single();
    if (error || !data) throw new Error(error?.message ?? "Unable to create review request.");
    await logActivity("customer_review", data.id, "review_requested");
    refreshCrm();
    return { ok: true, message: "Review link created.", token: data.request_token };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to create review request." }; }
}

export async function reviewCustomerReview(id: string, status: "APPROVED" | "REJECTED"): Promise<ActionResult> {
  try {
    z.uuid().parse(id);
    const identity = await requireAdmin(["ADMIN"]);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("customer_reviews").update({
      status,
      reviewed_by: identity.id,
      reviewed_at: new Date().toISOString(),
      published_at: status === "APPROVED" ? new Date().toISOString() : null,
    }).eq("id", id).eq("status", "PENDING");
    if (error) throw new Error(error.message);
    await logActivity("customer_review", id, status.toLowerCase());
    refreshCrm();
    return { ok: true, message: `Review ${status.toLowerCase()}.` };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to review this feedback." }; }
}
