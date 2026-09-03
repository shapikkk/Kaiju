import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, ImageOff, Copy, Download, Trash2 } from 'lucide-react';
import { LightBox } from '@shared/ui/lightbox';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@shared/ui/context-menu';

interface AttachmentRendererProps {
  url: string;
  name: string | null;
  /** The DM API also emits 'video' and 'audio'; both fell through to the
   *  generic file card before, so they were never actually playable. */
  type: 'image' | 'video' | 'audio' | 'file' | string;
  isMine: boolean;
  onDelete?: () => void;
  onImageLoad?: () => void;
}

export function AttachmentRenderer({ url, name, type, isMine, onDelete, onImageLoad }: AttachmentRendererProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onImageLoad?.();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name ?? 'image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Image URL copied'))
      .catch(() => {});
  };

  if (type === 'image') {
    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              onClick={() => setLightboxOpen(true)}
              className="group/img mt-1.5 block focus:outline-none"
              disabled={failed}
            >
              <div className="relative w-[260px] max-w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50">
                {/* Skeleton only until the first paint; a failure swaps in a
                    real message instead of leaving a dead grey rectangle. */}
                {!loaded && !failed && (
                  <div className="kj-shimmer aspect-[4/3] w-full" />
                )}
                {failed && (
                  <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/60">
                    <ImageOff className="h-5 w-5" />
                    <span className="text-[10px]">Image unavailable</span>
                  </div>
                )}
                <img
                  src={url}
                  alt={name ?? 'image'}
                  className={`block max-h-[320px] w-full object-cover transition-all duration-300 group-hover/img:brightness-105 ${loaded && !failed ? 'opacity-100' : 'absolute inset-0 h-0 opacity-0'}`}
                  loading="lazy"
                  onLoad={handleLoad}
                  onError={() => setFailed(true)}
                />
              </div>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem className="gap-2" onClick={handleCopyUrl}>
              <Copy className="h-3.5 w-3.5" /> Copy Image URL
            </ContextMenuItem>
            <ContextMenuItem className="gap-2" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Download
            </ContextMenuItem>
            {isMine && onDelete && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
        <LightBox images={[url]} index={lightboxOpen ? 0 : null} onClose={() => setLightboxOpen(false)} />
      </>
    );
  }

  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        className="mt-1.5 max-h-[320px] w-[260px] max-w-full rounded-xl bg-black ring-1 ring-border/50"
      />
    );
  }

  if (type === 'audio') {
    return (
      <audio src={url} controls className="mt-1.5 w-[260px] max-w-full" />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex min-w-0 max-w-[220px] items-center gap-3 rounded-xl border bg-background px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/60"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium leading-tight">{name ?? 'File'}</p>
        <p className="text-[10px] text-muted-foreground">Open file</p>
      </div>
    </a>
  );
}
