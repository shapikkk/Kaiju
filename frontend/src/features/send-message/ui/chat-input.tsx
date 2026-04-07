import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Reply, X, Paperclip, FileText, Pencil, Globe, ArrowUp,
  LayoutGrid, Plus, AtSign
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Switch } from '@shared/ui/switch';
import { Badge } from '@shared/ui/badge';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@shared/ui/dropdown-menu';
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from '@shared/ui/command';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@shared/ui/popover';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider
} from '@shared/ui/tooltip';
import { PAGE_MENTIONS, MESSAGE_PRIORITIES } from '@shared/config/chat-constants';
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
}


function MentionableIcon({ item }: { item: { type: string; title: string; image?: string } }) {
  return item.type === "page" ? (
    <span className="flex size-4 items-center justify-center text-xs">
      {item.image}
    </span>
  ) : (
    <Avatar className="size-4">
      <AvatarImage src={item.image} />
      <AvatarFallback className="text-[9px]">{item.title[0]}</AvatarFallback>
    </Avatar>
  );
}

export function ChatInput({ replyingTo, editingMsg, members = [], onCancelReply, onCancelEdit, onSend, onEdit, isSending }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionPopoverOpen, setMentionPopoverOpen] = useState(false);
  const [priorityPopoverOpen, setPriorityPopoverOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<(typeof MESSAGE_PRIORITIES)[0]>(MESSAGE_PRIORITIES[0]);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);

  const mentionableItems = useMemo(() => {
    const users = members.map(m => ({
      type: "user",
      title: m.name,
      image: m.avatar_url ?? undefined,
      workspace: "Workspace"
    }));
    return [...PAGE_MENTIONS, ...users];
  }, [members]);

  const grouped = useMemo(() => {
    return mentionableItems.reduce((acc, item) => {
      const isAvailable = !mentions.includes(item.title);
      if (isAvailable) {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
      }
      return acc;
    }, {} as Record<string, typeof mentionableItems>);
  }, [mentions, mentionableItems]);

  const hasMentions = mentions.length > 0;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editingMsg) setInputValue(editingMsg.body ?? '');
    else setInputValue('');
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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => { resize(); }, [inputValue, resize]);

  const reset = useCallback(() => {
    setInputValue('');
    setPendingFile(null);
    setMentions([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, []);

  const canSend = (!!inputValue.trim() || !!pendingFile || mentions.length > 0) && !isSending;

  const handleSend = useCallback(() => {
    const finalBody = inputValue.trim();

    if (editingMsg) {
      if (!finalBody && !pendingFile) return;
      onEdit(editingMsg.id, finalBody);
      onCancelEdit();
      reset();
      return;
    }

    if (!canSend) return;
    onSend(finalBody, replyingTo?.id ?? null, pendingFile ?? null);
    onCancelReply();
    reset();
  }, [editingMsg, canSend, inputValue, onEdit, onSend, replyingTo, pendingFile, onCancelEdit, onCancelReply, reset, mentions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) setPendingFile(file);
    e.target.value = '';
  };

  const sendDisabled = editingMsg ? !inputValue.trim() : !canSend;
  const hasFile = !!pendingFile && !editingMsg;
  const isImage = pendingFile?.type.startsWith('image/') ?? false;
  const previewUrl = isImage && pendingFile ? URL.createObjectURL(pendingFile) : null;

  return (
    <TooltipProvider>
      <div className={`relative flex w-full flex-col rounded-[28px] border border-border/40 bg-background/60 backdrop-blur-xl shadow-lg transition-all focus-within:shadow-xl focus-within:ring-1 focus-within:ring-ring/50 ${editingMsg ? 'border-amber-500/50' : ''}`}>
        <div className="flex flex-col gap-2 pt-2 px-3">

          {!editingMsg && !replyingTo && !hasFile && (
            <div className="flex flex-wrap items-center gap-2">
              <Popover open={mentionPopoverOpen} onOpenChange={setMentionPopoverOpen}>
                <Tooltip>
                  <TooltipTrigger asChild onFocusCapture={(e) => e.stopPropagation()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size={!hasMentions ? "sm" : "icon"}
                        className={`h-7 transition-transform ${hasMentions ? 'w-7 rounded-full' : 'rounded-md px-2 text-xs text-muted-foreground'}`}
                      >
                        <AtSign className={!hasMentions ? "mr-1.5 h-3 w-3" : "h-3.5 w-3.5"} /> 
                        {!hasMentions && "Add context"}
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Mention a person, page, or date</TooltipContent>
                </Tooltip>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search pages..." />
                    <CommandList 
                      className="max-h-[250px] overflow-y-auto overscroll-contain"
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <CommandEmpty>No pages found</CommandEmpty>
                      {Object.entries(grouped).map(([type, items]) => (
                        <CommandGroup key={type} heading={type === "page" ? "Pages" : "Users"}>
                          {items.map((item) => (
                            <CommandItem
                              key={item.title}
                              value={item.title}
                              onSelect={() => {
                                if (item.type === 'user') {
                                  setInputValue((prev) => prev + '@' + item.title + ' ');
                                } else {
                                  setMentions((prev) => [...prev, item.title]);
                                }
                                setMentionPopoverOpen(false);
                              }}
                              className="gap-2 rounded-lg"
                            >
                              <MentionableIcon item={item} />
                              {item.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {hasMentions && (
                <div className="-m-1.5 no-scrollbar flex gap-1 overflow-y-auto p-1.5">
                  {mentions.map((mention) => {
                    const item = mentionableItems.find((i) => i.title === mention);
                    if (!item) return null;
                    return (
                      <Button
                        key={mention}
                        size="sm"
                        variant="secondary"
                        className="h-6 rounded-full px-2 text-[11px]"
                        onClick={() => setMentions((prev) => prev.filter((m) => m !== mention))}
                      >
                        <MentionableIcon item={item} />
                        <span className="ml-1.5">{item.title}</span>
                        <X className="ml-1 h-3 w-3" />
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {editingMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5">
              <Pencil className="h-3 w-3 shrink-0 text-amber-500" />
              <p className="min-w-0 flex-1 truncate text-[11px] text-amber-600">{editingMsg.body}</p>
              <button onClick={() => { onCancelEdit(); reset(); }} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {replyingTo && !editingMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5">
              <Reply className="h-3 w-3 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold text-primary">{replyingTo.user.name} </span>
                <span className="truncate text-[10px] text-muted-foreground">{replyingTo.body}</span>
              </div>
              <button onClick={onCancelReply} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {hasFile && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
              {isImage && previewUrl ? (
                <img src={previewUrl} alt="preview" className="h-6 w-6 rounded-md object-cover" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
              <p className="min-w-0 flex-1 truncate text-[11px] font-medium">{pendingFile!.name}</p>
              <button onClick={() => setPendingFile(null)} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          rows={1}
          className="min-h-[44px] w-full resize-none border-0 bg-transparent px-5 py-2.5 text-[13px] focus-visible:outline-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground"
          placeholder={
            editingMsg  ? 'Edit your message…' :
            replyingTo  ? `Reply to ${replyingTo.user.name}…` :
                          'Ask, search, or make anything... (Shift+Enter for new line)'
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="flex items-center justify-between px-4 pb-2 pt-0">
          <div className="flex items-center gap-1">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground" onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
            
            <DropdownMenu open={priorityPopoverOpen} onOpenChange={setPriorityPopoverOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs font-normal text-muted-foreground">
                      {selectedPriority.name}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Select Priority</TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="top" align="start" className="min-w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Select Priority</DropdownMenuLabel>
                  {MESSAGE_PRIORITIES.map((model) => (
                    <DropdownMenuCheckboxItem
                      key={model.name}
                      checked={model.name === selectedPriority.name}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedPriority(model);
                      }}
                      className="pl-2 pr-2"
                    >
                      <span className="flex-1">{model.name}</span>
                      {model.badge && (
                        <Badge variant="secondary" className="h-5 ml-2 rounded-sm bg-blue-100 px-1 text-[10px] text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {model.badge}
                        </Badge>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu open={scopeMenuOpen} onOpenChange={setScopeMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs font-normal text-muted-foreground">
                  <Globe className="mr-1.5 h-3.5 w-3.5" /> All Sources
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-72">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                    <label htmlFor="web-search" className="flex w-full items-center cursor-pointer">
                      <Globe className="mr-2 h-4 w-4" /> Web Search
                      <Switch id="web-search" className="ml-auto" defaultChecked />
                    </label>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                    <label htmlFor="apps" className="flex w-full items-center cursor-pointer">
                      <LayoutGrid className="mr-2 h-4 w-4" /> Apps and Integrations
                      <Switch id="apps" className="ml-auto" defaultChecked />
                    </label>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" /> Connect Apps
                  </DropdownMenuItem>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    We'll only search in the sources selected here.
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            type="button"
            size="icon"
            aria-label="Send"
            className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
            disabled={sendDisabled}
            onClick={handleSend}
          >
            {editingMsg ? <Pencil className="h-3.5 w-3.5" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}