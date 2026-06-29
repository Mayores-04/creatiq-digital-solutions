import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/crm/auth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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
  const isImage = file instanceof File && file.type.startsWith("image/");
  const isVideo = file instanceof File && file.type.startsWith("video/");
  const sizeLimit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!(file instanceof File) || (!isImage && !isVideo) || file.size > sizeLimit) {
    return NextResponse.json({ error: "Upload an image under 8 MB or a video under 100 MB." }, { status: 400 });
  }

  if (purpose === "logo" && !isImage) {
    return NextResponse.json({ error: "Logo uploads must be images." }, { status: 400 });
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<{ secure_url: string; public_id: string; resource_type?: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `creatiq/${purpose === "logo" ? "brand" : purpose}`, resource_type: "auto" },
        (error, upload) => error || !upload ? reject(error ?? new Error("Media upload failed.")) : resolve(upload),
      ).end(bytes);
    });
    return NextResponse.json({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type ?? (isVideo ? "video" : "image") });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json({ error: "Unable to upload the media." }, { status: 502 });
  }
}
