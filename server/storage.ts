// Supabase Storage helpers for CFOS (Graceful Giving)
// Uploads receipt images/PDFs to Supabase Storage bucket "receipts".

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SUPABASE_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "receipts";

function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Storage config missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return { url: SUPABASE_URL.replace(/\/+$/, ""), key: SUPABASE_SERVICE_ROLE_KEY };
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/**
 * Upload a file to Supabase Storage and return its public URL.
 * @param relKey      relative path e.g. "receipts/expense-123.jpg"
 * @param data        Buffer, Uint8Array, or base64 string (raw, without data-URI prefix)
 * @param contentType MIME type
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { url, key: apiKey } = getSupabaseConfig();
  const key = appendHashSuffix(relKey.replace(/^\/+/, ""));

  // Convert base64 string → Buffer if needed
  const body: Buffer | Uint8Array =
    typeof data === "string" ? Buffer.from(data, "base64") : data;

  const uploadUrl = `${url}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${key}`;
  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: body as BodyInit,
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Supabase Storage upload failed (${resp.status}): ${msg}`);
  }

  // Public URL (bucket is set to public)
  const publicUrl = `${url}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${key}`;
  return { key, url: publicUrl };
}

/**
 * Get a signed URL for a private file (valid for 1 hour).
 */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { url, key: apiKey } = getSupabaseConfig();
  const key = relKey.replace(/^\/+/, "");

  const signUrl = `${url}/storage/v1/object/sign/${SUPABASE_STORAGE_BUCKET}/${key}`;
  const resp = await fetch(signUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 3600 }),
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Supabase signed URL failed (${resp.status}): ${msg}`);
  }

  const result = (await resp.json()) as { signedURL?: string };
  return `${url}${result.signedURL}`;
}

/**
 * Get the public URL for a stored file.
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const { url } = getSupabaseConfig();
  const key = relKey.replace(/^\/+/, "");
  return {
    key,
    url: `${url}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${key}`,
  };
}
