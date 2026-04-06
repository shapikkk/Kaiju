import { useRef, useState } from 'react';
import { Button } from '@shared/ui/button';
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from '@/hooks/useApi';
import apiClient from '@shared/lib/api/client';
import type { Attachment } from "@shared/types";
import {
  Paperclip,
  Upload,
  Loader2,
  Trash2,
  FileText,
  Image as ImageIcon,
  Download,
} from 'lucide-react';

interface AttachmentSectionProps {
  taskId: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-4 w-4 text-blue-500" />;
  }
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

/**
 * Download a file via Axios (with Bearer token) as a blob,
 * then trigger a browser download via object URL.
 */
async function downloadFile(att: Attachment) {
  if (!att.url) return;

  try {
    const response = await apiClient.get(att.url, {
      responseType: 'blob',
      baseURL: '',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch {
    window.open(att.url, '_blank');
  }
}

export function AttachmentSection({ taskId }: AttachmentSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: attachments = [] } = useAttachments(taskId);
  const upload = useUploadAttachment(taskId);
  const deleteAttachment = useDeleteAttachment(taskId);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => upload.mutate(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Paperclip className="h-4 w-4" />
        Attachments
        {attachments.length > 0 && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {attachments.length}
          </span>
        )}
      </h3>

      {/* Drop zone */}
      <div
        className={`mb-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/30'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          multiple
        />
        <div className="flex flex-col items-center gap-1.5">
          {upload.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <p className="text-xs text-muted-foreground">
            {upload.isPending
              ? 'Uploading…'
              : 'Drop files here or'}
          </p>
          {!upload.isPending && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Browse Files
            </Button>
          )}
        </div>
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att: Attachment) => (
            <div
              key={att.id}
              className="group flex items-center justify-between rounded-lg border bg-card p-2 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {getFileIcon(att.mime_type)}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{att.filename}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(att.size_bytes)}
                    {att.user && ` · ${att.user.name}`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {att.url && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7"
                    onClick={() => downloadFile(att)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteAttachment.mutate(att.id)}
                  disabled={deleteAttachment.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
