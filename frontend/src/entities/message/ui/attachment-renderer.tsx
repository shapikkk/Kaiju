import { useEffect, useRef, useState } from 'react';
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
  /** True when the image was already decoded before we mounted (cache hit). */
  const [instant, setInstant] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = () => {
    setLoaded(true);
    onImageLoad?.();
  };

  /*
   * A cached image can finish decoding before React attaches onLoad, in which
   * case that event never fires and the image stays at opacity 0 — visible as
   * an empty grey box. Catch the already-complete case on mount.
   */
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !el.complete) return;
    if (el.naturalWidth > 0) {
      // Show it outright: there is nothing to wait for, and relying on a
      // transition to reveal it means a throttled tab can leave it invisible.
      setInstant(true);
      handleLoad();
    } else {
      setFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                {failed ? (
                  <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/60">
                    <ImageOff className="h-5 w-5" />
                    <span className="text-[10px]">Image unavailable</span>
                  </div>
                ) : (
                  <>
                    <img
                      ref={imgRef}
                      src={url}
                      alt={name ?? 'image'}
                      className={`block max-h-[320px] w-full object-cover group-hover/img:brightness-105 ${instant ? '' : 'transition-opacity duration-300'} ${loaded ? 'opacity-100' : 'opacity-0'}`}
                      loading="lazy"
                      onLoad={handleLoad}
                      onError={() => setFailed(true)}
                    />
                    {/* Overlaid rather than swapped in, so the image keeps its
                        place in the layout and nothing shifts when it appears. */}
                    {!loaded && (
                      <div className="kj-shimmer absolute inset-0 aspect-[4/3] w-full" />
                    )}
                  </>
                )}
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
