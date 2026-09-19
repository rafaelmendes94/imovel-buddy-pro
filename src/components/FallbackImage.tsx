import { useMemo, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  sources?: Array<string | null | undefined>;
  fallback?: string;
};

function cloudflareVariants(url: string) {
  try {
    const parsed = new URL(url);
    if (!/imagedelivery\.net$/i.test(parsed.hostname)) return [url];
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 3) return [url];
    const base = `https://${parsed.hostname}/${parts[0]}/${parts[1]}`;
    return [url, `${base}/public`];
  } catch {
    return [url];
  }
}

export function imageCandidates(input: Array<string | null | undefined>, fallback = PLACEHOLDER_IMAGE) {
  const out: string[] = [];
  for (const raw of input) {
    const value = String(raw || "").trim();
    if (!value) continue;
    for (const candidate of cloudflareVariants(value)) {
      if (candidate && !out.includes(candidate)) out.push(candidate);
    }
  }
  if (!out.includes(fallback)) out.push(fallback);
  return out;
}

export function FallbackImage({ src, sources = [], fallback = PLACEHOLDER_IMAGE, onError, ...props }: Props) {
  const candidates = useMemo(() => imageCandidates([src, ...sources], fallback), [src, sources, fallback]);
  const [index, setIndex] = useState(0);

  return (
    <img
      {...props}
      src={candidates[index] || fallback}
      onError={(event) => {
        onError?.(event);
        setIndex((current) => (current < candidates.length - 1 ? current + 1 : current));
      }}
    />
  );
}
