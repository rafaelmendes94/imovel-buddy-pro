import { useState } from "react";
import { Play, Box, Maximize2 } from "lucide-react";
import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";

/** Provedores de embed permitidos (segurança: nada fora desta lista é embutido). */
const ALLOWED_EMBED_HOSTS = [
  "youtube.com", "www.youtube.com", "youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com",
  "player.vimeo.com", "vimeo.com",
  "my.matterport.com", "matterport.com",
  "kuula.co", "www.kuula.co",
  "momento360.com", "www.momento360.com",
  "roundme.com", "www.roundme.com",
];

export function isSafeEmbedUrl(url?: string | null) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return ALLOWED_EMBED_HOSTS.includes(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function youtubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] || null;
}
function vimeoId(url: string) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] || null;
}

export function videoEmbedUrl(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`;
  const vm = vimeoId(url);
  if (vm) return `https://player.vimeo.com/video/${vm}?autoplay=1`;
  return null;
}

export function isFileVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);
}

export function autoVideoThumb(url: string): string | null {
  const yt = youtubeId(url);
  return yt ? `https://img.youtube.com/vi/${yt}/maxresdefault.jpg` : null;
}

interface VideoBlockProps {
  url: string;
  poster?: string | null;
  title: string;
}

/** Player grande 16:9 — não inicia automaticamente; capa premium com botão Assistir. */
export function VideoBlock({ url, poster, title }: VideoBlockProps) {
  const [active, setActive] = useState(false);
  const embed = videoEmbedUrl(url);
  const file = isFileVideo(url);
  const thumb = poster || autoVideoThumb(url);

  if (!embed && !file) return null;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-border shadow-lg">
      {!active ? (
        <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 w-full h-full">
          <img
            src={thumb || PLACEHOLDER_IMAGE}
            alt={`Capa do vídeo de ${title}`}
            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
              <Play className="w-7 h-7 sm:w-9 sm:h-9 text-primary translate-x-0.5" fill="currentColor" />
            </span>
            <span className="text-white text-xs sm:text-sm font-bold uppercase tracking-[0.18em]">Assistir vídeo</span>
          </span>
        </button>
      ) : file ? (
        <video src={url} poster={thumb || undefined} controls autoPlay playsInline className="w-full h-full object-contain bg-black" />
      ) : (
        <iframe
          src={embed!}
          title={`Vídeo de ${title}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}
    </div>
  );
}

interface TourBlockProps {
  url: string;
  poster?: string | null;
  title: string;
}

/** Tour 360° — carrega o iframe apenas ao clicar (performance). */
export function TourBlock({ url, poster, title }: TourBlockProps) {
  const [active, setActive] = useState(false);
  const safe = isSafeEmbedUrl(url);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-primary/90 border border-border shadow-lg">
      {active && safe ? (
        <iframe
          src={url}
          title={`Tour 360° de ${title}`}
          className="w-full h-full border-0"
          allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => (safe ? setActive(true) : window.open(url, "_blank", "noopener,noreferrer"))}
          className="group absolute inset-0 w-full h-full"
        >
          {poster ? (
            <img src={poster} alt={`Capa do tour 360° de ${title}`} className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
              <Box className="w-8 h-8 text-primary" />
            </span>
            <span className="text-white text-base sm:text-lg font-bold tracking-tight">Tour virtual</span>
            <span className="text-white/85 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5" /> Explorar condomínio em 360°
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
