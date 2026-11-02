const CLOUDINARY_API = "https://api.cloudinary.com/v1_1";

function parseCloudinaryUrl(raw: string): { cloudName: string; apiKey: string; apiSecret: string } | null {
  const trimmed = raw.trim();
  const m = trimmed.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/i);
  if (!m) return null;
  return {
    apiKey: decodeURIComponent(m[1]),
    apiSecret: decodeURIComponent(m[2]),
    cloudName: m[3],
  };
}

function cloudinaryConfig() {
  const fromUrl = process.env.CLOUDINARY_URL
    ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
    : null;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || fromUrl?.cloudName;
  const apiKey = process.env.CLOUDINARY_API_KEY || fromUrl?.apiKey;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || fromUrl?.apiSecret;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary non configuré — ajoutez CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET dans chatagent/.env.local"
    );
  }
  return { cloudName, apiKey, apiSecret };
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    publicId: string;
    resourceType?: "image" | "raw" | "auto";
    mimeType?: string;
  }
): Promise<{ url: string; publicId: string }> {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = options.resourceType ?? "image";

  const params: Record<string, string> = {
    folder: options.folder,
    public_id: options.publicId,
    timestamp: String(timestamp),
  };

  const signaturePayload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const crypto = await import("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(signaturePayload + apiSecret)
    .digest("hex");

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: options.mimeType ?? "application/octet-stream" })
  );
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", options.folder);
  form.append("public_id", options.publicId);

  const uploadType = resourceType === "raw" ? "raw" : "image";
  const res = await fetch(`${CLOUDINARY_API}/${cloudName}/${uploadType}/upload`, {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? "Échec upload Cloudinary");
  }

  return { url: data.secure_url, publicId: data.public_id ?? options.publicId };
}
