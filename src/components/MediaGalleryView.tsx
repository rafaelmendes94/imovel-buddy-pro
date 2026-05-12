import { useState } from 'react';
import { FileText, Video as VideoIcon, ExternalLink, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaGalleryViewProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: string[];
  kind?: 'image' | 'video' | 'file';
  emptyText?: string;
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i.test(url);
}
function isVideoUrl(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com|\.mp4($|\?)|\.webm($|\?)|\.mov($|\?)/i.test(url);
}
function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function MediaGalleryView({ title, icon: Icon, items, kind = 'image', emptyText }: MediaGalleryViewProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!items || items.length === 0) {
    if (!emptyText) return null;
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-accent" />} {title}
        </h3>
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  const images = items.filter(isImageUrl);
  const lightboxOpen = lightbox !== null && images[lightbox];

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-accent" />} {title}
        <span className="text-[10px] font-medium text-muted-foreground">({items.length})</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {items.map((url, idx) => {
          const isImg = (kind === 'image' || isImageUrl(url)) && !isVideoUrl(url);
          const isVid = isVideoUrl(url);
          const yt = isVid ? youtubeEmbed(url) : null;
          const isPdf = /\.pdf($|\?)/i.test(url);
          if (isImg) {
            const imgIdx = images.indexOf(url);
            return (
              <button key={idx} onClick={() => setLightbox(imgIdx)} className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </button>
            );
          }
          if (isVid) {
            return (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square flex flex-col items-center justify-center gap-1 p-2 hover:bg-muted/50 transition-colors">
                {yt ? (
                  <img src={`https://img.youtube.com/vi/${yt.split('/').pop()}/hqdefault.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="relative z-10 w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                  <VideoIcon className="w-5 h-5 text-white" />
                </div>
              </a>
            );
          }
          return (
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" download className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square flex flex-col items-center justify-center gap-1.5 p-2 text-center hover:bg-muted/50 transition-colors">
              <FileText className={`w-8 h-8 ${isPdf ? 'text-red-500' : 'text-primary'}`} />
              <span className="text-[10px] text-muted-foreground line-clamp-2 break-all">{decodeURIComponent(url.split('/').pop() || 'arquivo')}</span>
              <Download className="w-3.5 h-3.5 text-muted-foreground absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setLightbox(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightbox(null); }} className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
            <X className="w-6 h-6" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? 0 : (i - 1 + images.length) % images.length)); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? 0 : (i + 1) % images.length)); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img src={images[lightbox!]} alt="" onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm">
            {(lightbox ?? 0) + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
