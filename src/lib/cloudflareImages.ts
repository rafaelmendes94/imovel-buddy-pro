import { supabase } from "@/integrations/supabase/client";

type UploadOptions = {
  folder?: string;
  source?: string;
};

export async function uploadImageToCloudflare(file: File, options: UploadOptions = {}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Cloudflare Images aceita apenas arquivos de imagem.");
  }

  const { data, error } = await supabase.functions.invoke("cloudflare-direct-upload", {
    body: {
      filename: file.name,
      folder: options.folder || "",
      source: options.source || "mv-connect",
    },
  });

  if (error || data?.error || !data?.uploadURL || !data?.deliveryUrl) {
    throw new Error(data?.error || error?.message || "Não foi possível iniciar upload no Cloudflare.");
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

  return String(data.deliveryUrl);
}
