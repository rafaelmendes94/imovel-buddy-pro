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

const cleanPathPart = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const errorDetail = (payload: DirectUploadResponse | null | undefined, fallback: string) => {
  const details = payload?.details as any;
  const cloudflareMessage =
    details?.errors?.[0]?.message ||
    details?.messages?.[0]?.message ||
    details?.error ||
    details?.message;
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

const uploadImageToSupabaseFallback = async (file: File, options: UploadOptions = {}) => {
  const folder = cleanPathPart(options.folder || "uploads") || "uploads";
  const baseName = cleanPathPart(file.name.replace(/\.[^.]+$/, "")) || "imagem";
  const ext = cleanPathPart(file.name.split(".").pop() || "jpg") || "jpg";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${baseName}.${ext}`;

  const { error } = await supabase.storage.from("site-assets").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    throw new Error(`Cloudflare falhou e o fallback do Supabase também falhou: ${error.message}`);
  }

  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error("Upload enviado, mas não foi possível gerar URL pública.");
  }

  return data.publicUrl;
};

export async function uploadImageToCloudflare(file: File, options: UploadOptions = {}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Cloudflare Images aceita apenas arquivos de imagem.");
  }

  let data: DirectUploadResponse;
  try {
    data = await invokeUploadFunction("cloudflare-direct-upload", {
      filename: file.name,
      folder: options.folder || "",
      source: options.source || "mv-connect",
    });
  } catch (err) {
    console.warn("Cloudflare Images indisponível, usando fallback Supabase Storage:", err);
    return uploadImageToSupabaseFallback(file, options);
  }

  if (!data.uploadURL || !data.deliveryUrl) {
    console.warn("Cloudflare Images não retornou URL válida, usando fallback Supabase Storage:", data);
    return uploadImageToSupabaseFallback(file, options);
  }

  const form = new FormData();
  form.append("file", file);

  const response = await fetch(data.uploadURL, {
    method: "POST",
    body: form,
  });
  const uploadResult = await response.json().catch(() => null);

  if (!response.ok || uploadResult?.success === false) {
    console.warn("Cloudflare recusou o upload, usando fallback Supabase Storage:", uploadResult);
    return uploadImageToSupabaseFallback(file, options);
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
