import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Reply, X, Paperclip, FileText, Pencil, ArrowUp, AtSign, CornerDownLeft,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from '@shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@shared/ui/tooltip';
import { cn } from '@shared/lib/utils';
import type { WorkspaceMessage, DirectMessage, WorkspaceMember } from "@shared/types";

type ChatMsg = WorkspaceMessage | DirectMessage;

interface ChatInputProps {
  replyingTo: ChatMsg | null;
  editingMsg: ChatMsg | null;
  members?: WorkspaceMember[];
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSend: (body: string, replyToId: number | null, file: File | null) => void;
  onEdit: (id: number, body: string) => void;
  isSending: boolean;
  placeholder?: string;
}

/** Matches the backend's `max:5000` rule on the message body. */
const MAX_LEN = 5000;

export function ChatInput({
  replyingTo, editingMsg, members = [], onCancelReply, onCancelEdit,
  onSend, onEdit, isSending, placeholder,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setInputValue(editingMsg ? (editingMsg.body ?? '') : '');
    textareaRef.current?.focus();
  }, [editingMsg]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => { resize(); }, [inputValue, resize]);

  const reset = useCallback(() => {
    setInputValue('');
    setPendingFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, []);

  const trimmed = inputValue.trim();
  const isOverLimit = inputValue.length > MAX_LEN;

  // Only real content counts. The previous version also allowed sending on
  // decorative "mention chips" alone, which produced an empty body the API
  // rejected with a 422.
  const canSend = (!!trimmed || !!pendingFile) && !isSending && !isOverLimit;

  const handleSend = useCallback(() => {
    const body = inputValue.trim();

    if (editingMsg) {
      if (!body || isOverLimit) return;
      onEdit(editingMsg.id, body);
      onCancelEdit();
      reset();
      return;
    }

    if (!canSend) return;
    onSend(body, replyingTo?.id ?? null, pendingFile ?? null);
    onCancelReply();
    reset();
  }, [
    editingMsg, canSend, inputValue, isOverLimit, onEdit, onSend,
    replyingTo, pendingFile, onCancelEdit, onCancelReply, reset,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    // Escape backs out of whatever mode the composer is in.
    if (e.key === 'Escape') {
      if (editingMsg) { onCancelEdit(); reset(); }
      else if (replyingTo) onCancelReply();
      else if (pendingFile) setPendingFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) setPendingFile(file);
    e.target.value = '';
  };

  /** Mentions insert real text, so they actually reach the message body. */
  const insertMention = (name: string) => {
    setInputValue((prev) => {
      const sep = prev.length === 0 || prev.endsWith(' ') ? '' : ' ';
      return `${prev}${sep}@${name} `;
    });
    setMentionOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const previewUrl = useMemo(
    () => (pendingFile?.type.startsWith('image/') ? URL.createObjectURL(pendingFile) : null),
    [pendingFile],
  );
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const hasFile = !!pendingFile && !editingMsg;
  const sendDisabled = editingMsg ? (!trimmed || isOverLimit) : !canSend;

  const composerPlaceholder =
    editingMsg ? 'Edit your message…'
    : replyingTo ? `Reply to ${replyingTo.user.name}…`
    : placeholder ?? 'Write a message…';

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative flex w-full flex-col overflow-hidden rounded-2xl border bg-background/80 shadow-lg backdrop-blur-xl',
          'transition-[box-shadow,border-color] duration-200',
          'focus-within:border-primary/40 focus-within:shadow-xl focus-within:ring-1 focus-within:ring-primary/20',
          editingMsg && 'border-amber-500/50',
          isOverLimit && 'border-destructive/60',
        )}
      >
        {/* Context strips — reply target, edit target, pending attachment. */}
        {editingMsg && (
          <div className="kj-fade flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 py-1.5">
            <Pencil className="h-3 w-3 shrink-0 text-amber-500" />
            <p className="min-w-0 flex-1 truncate text-[11px] text-amber-600 dark:text-amber-400">
              {editingMsg.body}
            </p>
            <button
              onClick={() => { onCancelEdit(); reset(); }}
              className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Cancel edit"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {replyingTo && !editingMsg && (
          <div className="kj-fade flex items-center gap-2 border-b border-primary/20 bg-primary/[0.06] px-3 py-1.5">
            <Reply className="h-3 w-3 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 truncate">
              <span className="text-[10px] font-semibold text-primary">{replyingTo.user.name} </span>
              <span className="text-[10px] text-muted-foreground">{replyingTo.body}</span>
            </div>
            <button
              onClick={onCancelReply}
              className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {hasFile && (
          <div className="kj-fade flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-8 w-8 rounded-md object-cover ring-1 ring-border" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium">{pendingFile!.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {(pendingFile!.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={() => setPendingFile(null)}
              className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Remove attachment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          className="max-h-40 min-h-[42px] w-full resize-none border-0 bg-transparent px-4 py-3 text-[13px] leading-relaxed placeholder:text-muted-foreground/70 focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
          placeholder={composerPlaceholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="flex items-center gap-1 px-2 pb-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Attach a file</TooltipContent>
          </Tooltip>

          {members.length > 0 && (
            <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Mention someone"
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Mention someone</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-60 p-0" align="start" side="top">
                <Command>
                  <CommandInput placeholder="Search people…" />
                  <CommandList className="max-h-56">
                    <CommandEmpty>No one found</CommandEmpty>
                    <CommandGroup>
                      {members.map((m) => (
                        <CommandItem
                          key={m.id}
                          value={m.name}
                          onSelect={() => insertMention(m.name)}
                          className="gap-2 rounded-lg"
                        >
                          <Avatar className="size-5">
                            <AvatarImage src={m.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[9px]">{m.name[0]}</AvatarFallback>
                          </Avatar>
                          {m.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          <div className="ml-auto flex items-center gap-2">
            {inputValue.length > MAX_LEN - 500 && (
              <span
                className={cn(
                  'text-[10px] tabular-nums',
                  isOverLimit ? 'font-medium text-destructive' : 'text-muted-foreground',
                )}
              >
                {inputValue.length}/{MAX_LEN}
              </span>
            )}

            <span className="hidden items-center gap-1 text-[10px] text-muted-foreground/50 sm:flex">
              <CornerDownLeft className="h-3 w-3" /> to send
            </span>

            <Button
              type="button"
              size="icon"
              aria-label={editingMsg ? 'Save edit' : 'Send message'}
              className="h-8 w-8 shrink-0 rounded-lg transition-transform duration-150 active:scale-90 disabled:opacity-40"
              disabled={sendDisabled}
              onClick={handleSend}
            >
              {editingMsg ? <Pencil className="h-3.5 w-3.5" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
