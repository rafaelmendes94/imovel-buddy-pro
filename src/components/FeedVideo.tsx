import { useEffect, useRef, useState } from "react";

type Kind = "file" | "youtube" | "vimeo" | "cloudflare" | null;

interface ParsedVideo {
  kind: Kind;
  src: string;
  id?: string;
}

const FILE_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

export function parseVideoLink(raw?: string | null): ParsedVideo {
  const url = (raw || "").trim();
  if (!url) return { kind: null, src: "" };

  if (FILE_RE.test(url)) return { kind: "file", src: url };

  const yt =
    url.match(/(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/) ||
    url.match(/(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/) ||
    url.match(/(?:youtube\.com\/.*[?&]v=)([A-Za-z0-9_-]{6,})/) ||
    url.match(/(?:youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return { kind: "youtube", src: url, id: yt[1] };

  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", src: url, id: vm[1] };

  const cf =
    url.match(/iframe\.videodelivery\.net\/([A-Za-z0-9_-]+)/) ||
    url.match(/videodelivery\.net\/([A-Za-z0-9_-]+)\/(?:manifest|downloads|thumbnails)/) ||
    url.match(/watch\.cloudflarestream\.com\/([A-Za-z0-9_-]+)/) ||
    url.match(/cloudflarestream\.com\/([A-Za-z0-9_-]+)\//);
  if (cf) return { kind: "cloudflare", src: `https://iframe.videodelivery.net/${cf[1]}`, id: cf[1] };

  return { kind: null, src: url };
}

export function hasPlayableVideo(raw?: string | null) {
  return parseVideoLink(raw).kind !== null;
}

interface FeedVideoProps {
  link?: string | null;
  poster: string;
  alt: string;
  active: boolean;
  onClick?: () => void;
}

/**
 * Player vertical estilo Reels: inicia sozinho quando o card fica em destaque
 * e pausa ao sair. Sempre silencioso e inline para funcionar em iOS/Android.
 */
export function FeedVideo({ link, poster, alt, active, onClick }: FeedVideoProps) {
  const parsed = parseVideoLink(link);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Arquivo de vídeo: play/pause conforme destaque
  useEffect(() => {
    if (parsed.kind !== "file" || failed) return;
    const el = videoRef.current;
    if (!el) return;
    if (active) {
      el.muted = true;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
      setReady(false);
    }
  }, [active, parsed.kind, failed]);

  const showPoster = !parsed.kind || failed || !active || !ready;

  return (
    <div className="absolute inset-0 bg-black" onClick={onClick}>
      {parsed.kind === "file" && !failed && (
        <video
          ref={videoRef}
          src={parsed.src}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay={active}
          preload={active ? "auto" : "metadata"}
          disablePictureInPicture
          controls={false}
          onCanPlay={() => setReady(true)}
          onPlaying={() => setReady(true)}
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {(parsed.kind === "youtube" || parsed.kind === "vimeo" || parsed.kind === "cloudflare") && !failed && active && (
        <iframe
          key={parsed.id}
          title={alt}
          src={
            parsed.kind === "youtube"
              ? `https://www.youtube.com/embed/${parsed.id}?autoplay=1&mute=1&loop=1&playlist=${parsed.id}&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`
              : parsed.kind === "vimeo"
              ? `https://player.vimeo.com/video/${parsed.id}?autoplay=1&muted=1&loop=1&background=1`
              : `${parsed.src}?autoplay=true&muted=true&loop=true&controls=false`
          }
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
          className="absolute left-1/2 top-1/2 h-[105%] w-[178%] -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none md:w-[110%] md:h-[110%]"
          style={{ objectFit: "cover" } as React.CSSProperties}
        />
      )}

      {showPoster && (
        <img
          src={poster}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
