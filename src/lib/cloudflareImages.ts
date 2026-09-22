import { supabase } from "@/integrations/supabase/client";

type UploadOptions = {
  folder?: string;
  source?: string;
};

type DirectUploadResponse = {
  uploadURL?: string;
  deliveryUrl?: string;
  iframeUrl?: string;
  error?: string;
  details?: unknown;
};

const errorDetail = (payload: DirectUploadResponse | null | undefined, fallback: string) => {
  const details = payload?.details as any;
  const cloudflareMessage =
    details?.errors?.[0]?.message ||
    details?.errors?.[0]?.code ||
    details?.messages?.[0]?.message ||
    details?.error ||
    details?.message ||
    (typeof details === "string" ? details : "");
  return payload?.error || cloudflareMessage || fallback;
};

const invokeUploadFunction = async (name: string, body: Record<string, unknown>) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Faça login novamente para enviar arquivos.");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as DirectUploadResponse | null;
  if (!response.ok || payload?.error) {
    throw new Error(errorDetail(payload, `Falha na função ${name} (${response.status}).`));
  }

  return payload || {};
};

export async function uploadImageToCloudflare(file: File, options: UploadOptions = {}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Cloudflare Images aceita apenas arquivos de imagem.");
  }

  const data = await invokeUploadFunction("cloudflare-direct-upload", {
    filename: file.name,
    folder: options.folder || "",
    source: options.source || "mv-connect",
  });

  if (!data.uploadURL || !data.deliveryUrl) {
    throw new Error(errorDetail(data, "Cloudflare Images não retornou URL válida para upload."));
  }

  const form = new FormData();
  form.append("file", file);

  const response = await fetch(data.uploadURL, {
    method: "POST",
    body: form,
  });
  const uploadResult = await response.json().catch(() => null);

  if (!response.ok || uploadResult?.success === false) {
    throw new Error(uploadResult?.errors?.[0]?.message || "Cloudflare recusou o upload da imagem.");
  }

  const variants = Array.isArray(uploadResult?.result?.variants) ? uploadResult.result.variants : [];
  const publicVariant = variants.find((url: string) => /\/public($|\?)/i.test(url));
  if (publicVariant || variants[0]) {
    return String(publicVariant || variants[0]);
  }

  return String(data.deliveryUrl);
}

export async function uploadVideoToCloudflare(file: File, options: UploadOptions = {}) {
  if (!file.type.startsWith("video/")) {
    throw new Error("Cloudflare Stream aceita apenas arquivos de vídeo.");
  }

  const data = await invokeUploadFunction("cloudflare-stream-direct-upload", {
    filename: file.name,
    folder: options.folder || "",
    source: options.source || "mv-connect",
    maxDurationSeconds: 3600,
  });

  if (!data?.uploadURL || !data?.iframeUrl) {
    throw new Error(errorDetail(data, "Não foi possível iniciar upload no Cloudflare Stream."));
  }

  const form = new FormData();
  form.append("file", file);

  const response = await fetch(data.uploadURL, {
    method: "POST",
    body: form,
  });
  const uploadResult = await response.json().catch(() => null);

  if (!response.ok || uploadResult?.success === false) {
    throw new Error(uploadResult?.errors?.[0]?.message || "Cloudflare recusou o upload do vídeo.");
  }

  return String(data.iframeUrl);
}
