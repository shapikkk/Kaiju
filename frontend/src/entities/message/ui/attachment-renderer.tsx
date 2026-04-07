import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, ImageIcon, Copy, Download, Trash2 } from 'lucide-react';
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
  type: 'image' | 'file';
  isMine: boolean;
  onDelete?: () => void;
  onImageLoad?: () => void;
}

export function AttachmentRenderer({ url, name, type, isMine, onDelete, onImageLoad }: AttachmentRendererProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
            <button onClick={() => setLightboxOpen(true)} className="mt-1.5 block focus:outline-none">
              <div className="relative overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: '4/3', width: '240px', maxWidth: '100%' }}>
                {!loaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
                <img
                  src={url}
                  alt={name ?? 'image'}
                  className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  onLoad={handleLoad}
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
