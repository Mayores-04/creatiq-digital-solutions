import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/crm/auth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity || identity.role !== "ADMIN") return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });

  const formData = await request.formData();
  const file = formData.get("file");
  const requestedPurpose = String(formData.get("purpose") ?? "");
  const purpose = requestedPurpose === "logo" || requestedPurpose === "content" ? requestedPurpose : "projects";
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Upload an image smaller than 8 MB." }, { status: 400 });
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `creatiq/${purpose === "logo" ? "brand" : purpose}`, resource_type: "image" },
        (error, upload) => error || !upload ? reject(error ?? new Error("Image upload failed.")) : resolve(upload),
      ).end(bytes);
    });
    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json({ error: "Unable to upload the image." }, { status: 502 });
  }
}
