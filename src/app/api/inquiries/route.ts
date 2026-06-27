import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_COMPANY_SETTINGS } from "@/lib/crm/constants";
import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase/config";

export const runtime = "nodejs";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  services: z.array(z.string().trim().min(2).max(100)).min(1).max(8),
  description: z.string().trim().min(10).max(5_000),
  website: z.string().max(0).optional(),
});

type CompanyEmailResult = {
  data: { company_email: string | null } | null;
  error: { message: string } | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character];
  });
}

function createConfirmationEmail({
  name,
  services,
}: {
  name: string;
  services: string[];
}) {
  const safeName = escapeHtml(name);
  const serviceSummary = services.join(", ");
  const safeServiceSummary = escapeHtml(serviceSummary);

  return {
    text: [
      `Hi ${name},`,
      "",
      "Your idea is officially in the Creatiq studio.",
      "We received your inquiry and will review it shortly.",
      "",
      `Services selected: ${serviceSummary}`,
      "",
      "What happens next:",
      "1. We review your project details.",
      "2. We outline the right creative direction.",
      "3. We get back to you with the next steps.",
      "",
      "Creatiq Digital Solutions",
      "Cainta, Rizal",
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#020b1f;color:#d8e2fe;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#020b1f;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#081327;border:1px solid rgba(8,189,255,0.28);border-radius:24px;overflow:hidden;">
            <tr><td style="height:5px;background:linear-gradient(90deg,#0356e7,#08bdff);"></td></tr>
            <tr>
              <td style="padding:42px 40px 18px;">
                <p style="margin:0;color:#08bdff;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Creatiq Digital Solutions</p>
                <h1 style="margin:18px 0 14px;color:#bac3ff;font-size:34px;line-height:1.1;letter-spacing:-1px;">Your idea is officially in the studio.</h1>
                <p style="margin:0;color:#c4c5d8;font-size:16px;line-height:1.75;">Hi ${safeName},<br />Thanks for reaching out. We&apos;ve received your inquiry and our team is already preparing to explore the best path for your project.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 40px 8px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background:rgba(8,189,255,0.10);border:1px solid rgba(8,189,255,0.26);border-radius:14px;">
                  <tr><td style="padding:13px 16px;color:#86d2ff;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;line-height:1.6;">PROJECT FOCUS &nbsp;·&nbsp; ${safeServiceSummary}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 34px;">
                <p style="margin:0 0 16px;color:#bac3ff;font-size:17px;font-weight:700;">What happens next</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr><td style="padding:12px 0;border-top:1px solid rgba(186,195,255,0.14);color:#c4c5d8;font-size:14px;line-height:1.5;"><span style="color:#08bdff;font-weight:700;">01</span>&nbsp;&nbsp;We review your project details.</td></tr>
                  <tr><td style="padding:12px 0;border-top:1px solid rgba(186,195,255,0.14);color:#c4c5d8;font-size:14px;line-height:1.5;"><span style="color:#08bdff;font-weight:700;">02</span>&nbsp;&nbsp;We outline the right creative direction.</td></tr>
                  <tr><td style="padding:12px 0;border-top:1px solid rgba(186,195,255,0.14);border-bottom:1px solid rgba(186,195,255,0.14);color:#c4c5d8;font-size:14px;line-height:1.5;"><span style="color:#08bdff;font-weight:700;">03</span>&nbsp;&nbsp;We get back to you with the next steps.</td></tr>
                </table>
                <p style="margin:28px 0 0;color:#c4c5d8;font-size:14px;line-height:1.7;">While you wait, keep that spark alive. The best digital work starts with a good idea—and you&apos;ve already done the hard part by sharing yours.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 40px;background:#061a3a;border-top:1px solid rgba(8,189,255,0.16);">
                <p style="margin:0;color:#86d2ff;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Creatiq Digital Solutions</p>
                <p style="margin:7px 0 0;color:#c4c5d8;font-size:12px;line-height:1.5;">Cainta, Rizal &nbsp;·&nbsp; Building digital products with purpose.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

export async function POST(request: Request) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("Inquiry email is not configured.");
    return Response.json({ error: "Email service is unavailable." }, { status: 503 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsedInquiry = inquirySchema.safeParse(body);

  if (!parsedInquiry.success) {
    return Response.json(
      { error: "Please complete all fields with valid information." },
      { status: 400 },
    );
  }

  const { name, email, services, description, website } = parsedInquiry.data;

  if (website) {
    return Response.json({ ok: true });
  }

  if (!hasSupabaseConfig()) {
    console.error("Inquiry CRM persistence is not configured.");
    return Response.json({ error: "Inquiry service is temporarily unavailable." }, { status: 503 });
  }

  const { url, publishableKey } = getSupabaseConfig();
  const crm = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let companyEmail = process.env.INQUIRY_TO ?? DEFAULT_COMPANY_SETTINGS.company_email;

  try {
    const settings = await crm
      .from("company_settings")
      .select("company_email")
      .eq("id", true)
      .maybeSingle() as unknown as CompanyEmailResult;

    if (!settings.error && settings.data?.company_email) {
      companyEmail = settings.data.company_email;
    }
  } catch (error) {
    console.warn("Unable to load company inquiry email; using fallback recipient.", error);
  }

  try {
    const { error } = await crm.rpc("submit_website_inquiry", {
      inquiry_name: name,
      inquiry_email: email,
      inquiry_services: services,
      inquiry_description: description,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Unable to save website inquiry:", error);
    return Response.json(
      { error: "We could not save your inquiry. Please try again shortly." },
      { status: 503 },
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const serviceSummary = services.join(", ");
  const safeServiceSummary = escapeHtml(serviceSummary);
  const safeDescription = escapeHtml(description).replace(/\n/g, "<br />");
  const confirmation = createConfirmationEmail({ name, services });

  try {
    const companyMail = transporter.sendMail({
      from: `Creatiq Website <${smtpUser}>`,
      to: companyEmail,
      replyTo: email,
      subject: `New Creatiq inquiry: ${serviceSummary}`,
      text: [
        "New inquiry from the Creatiq website",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Services: ${serviceSummary}`,
        "",
        "Project description:",
        description,
      ].join("\n"),
      html: `<h2>New Creatiq website inquiry</h2><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Services:</strong> ${safeServiceSummary}</p><p><strong>Project description:</strong><br />${safeDescription}</p>`,
    });

    const customerMail = transporter.sendMail({
      from: `Creatiq Digital Solutions <${smtpUser}>`,
      to: email,
      replyTo: companyEmail,
      subject: "We received your inquiry — Creatiq Digital Solutions",
      text: confirmation.text,
      html: confirmation.html,
    });

    const [companyResult, customerResult] = await Promise.allSettled([
      companyMail,
      customerMail,
    ]);

    if (companyResult.status === "rejected" || customerResult.status === "rejected") {
      console.error("Inquiry email delivery failed:", {
        company: companyResult.status === "rejected" ? companyResult.reason : "sent",
        customer: customerResult.status === "rejected" ? customerResult.reason : "sent",
      });

      return Response.json(
        {
          error:
            "Your inquiry was saved, but one of the confirmation emails could not be sent. Please contact us directly if you do not receive a confirmation.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Unable to send inquiry email:", error);
    return Response.json(
      { error: "We could not send your inquiry. Please try again later." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
