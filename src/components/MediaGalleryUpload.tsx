import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, Plus, FileText, Video as VideoIcon, ExternalLink } from 'lucide-react';

type Kind = 'image' | 'video' | 'file';

interface MediaGalleryUploadProps {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  folder: string; // e.g. 'edificios/<id>/fotos-infra'
  kind?: Kind; // controls accept + preview style; default image
  accept?: string; // override accept attribute
  allowUrl?: boolean; // also allow pasting an external URL
  multiple?: boolean;
}

export function MediaGalleryUpload({
  label,
  values,
  onChange,
  folder,
  kind = 'image',
  accept,
  allowUrl = true,
  multiple = true,
}: MediaGalleryUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const acceptAttr =
    accept ??
    (kind === 'image'
      ? 'image/*'
      : kind === 'video'
      ? 'video/*'
      : 'image/*,video/*,application/pdf,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx');

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: false });
      if (error) {
        toast({ title: `Erro ao enviar ${file.name}`, description: error.message, variant: 'destructive' });
        continue;
      }
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
      uploaded.push(urlData.publicUrl);
    }
    if (uploaded.length) {
      onChange([...(values || []), ...uploaded]);
      toast({ title: `${uploaded.length} arquivo(s) enviado(s) ✅` });
    }
    setUploading(false);
  };

  const addUrl = () => {
    const v = urlInput.trim();
    if (!v) return;
    onChange([...(values || []), v]);
    setUrlInput('');
  };

  const remove = (idx: number) => {
    const next = [...values];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <span className="text-[10px] text-muted-foreground">{values?.length || 0} item(ns)</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Enviando...' : 'Enviar arquivos'}
          <input
            type="file"
            multiple={multiple}
            accept={acceptAttr}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        {allowUrl && (
          <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={kind === 'video' ? 'Cole link do YouTube/Vimeo...' : 'Cole uma URL...'}
              className="h-9 text-xs"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addUrl} className="h-9 px-2">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {values && values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {values.map((url, idx) => {
            const isVideoUrl = /youtube\.com|youtu\.be|vimeo\.com|\.mp4($|\?)|\.webm($|\?)|\.mov($|\?)/i.test(url);
            const isPdf = /\.pdf($|\?)/i.test(url);
            const isImage = kind === 'image' || /\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i.test(url);
            return (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square">
                {isImage && !isVideoUrl && !isPdf ? (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : isVideoUrl ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center hover:bg-muted/50 transition-colors">
                    <VideoIcon className="w-6 h-6 text-primary" />
                    <span className="text-[10px] text-muted-foreground line-clamp-2 break-all">{url.split('/').pop()}</span>
                  </a>
                ) : (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center hover:bg-muted/50 transition-colors">
                    <FileText className="w-6 h-6 text-primary" />
                    <span className="text-[10px] text-muted-foreground line-clamp-2 break-all">{url.split('/').pop()}</span>
                  </a>
                )}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-md bg-background/90 flex items-center justify-center text-foreground hover:bg-background" title="Abrir">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button type="button" onClick={() => remove(idx)} className="w-6 h-6 rounded-md bg-destructive/90 flex items-center justify-center text-destructive-foreground hover:bg-destructive" title="Remover">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
