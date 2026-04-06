import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveWorkspace } from '@entities/channel/model/useActiveWorkspace';
import { useWorkspaceSearch } from '@shared/lib/api/useApi';
import { PRIORITY_CONFIG } from "@shared/types";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@shared/ui/command';
import { Button } from '@shared/ui/button';
import { Search, SquareCheckBig, Kanban, User, Loader2 } from 'lucide-react';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const workspaceSlug = useActiveWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data, isFetching } = useWorkspaceSearch(
    workspaceSlug ?? '',
    debouncedQuery,
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
  }, []);

  const handleSelect = useCallback(
    (destination: string) => {
      close();
      navigate(destination);
    },
    [close, navigate],
  );

  const hasResults =
    (data?.tasks?.length ?? 0) +
      (data?.boards?.length ?? 0) +
      (data?.users?.length ?? 0) >
    0;

  const showLoading = isFetching && debouncedQuery.length >= 2;

  return (
    <>
      {/* Trigger — replaces the mock search Input in TitleBar */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-64 justify-start gap-2 bg-muted/50 text-xs text-muted-foreground shadow-none"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] sm:block">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) close();
          else setOpen(true);
        }}
      >
        {/* Command must wrap all cmdk sub-components; shouldFilter=false because
            we do server-side filtering and manage results ourselves */}
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search tasks, boards, people…"
          />

          <CommandList>
            {/* Loading state */}
            {showLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {/* Idle / too short */}
            {!showLoading && debouncedQuery.length < 2 && (
              <CommandEmpty>
                {workspaceSlug
                  ? 'Type at least 2 characters to search.'
                  : 'Open a workspace first to search.'}
              </CommandEmpty>
            )}

            {/* No results */}
            {!showLoading &&
              debouncedQuery.length >= 2 &&
              !hasResults && (
                <CommandEmpty>
                  No results for "{debouncedQuery}".
                </CommandEmpty>
              )}

            {/* Results */}
            {!showLoading && hasResults && (
              <>
                {(data?.tasks?.length ?? 0) > 0 && (
                  <CommandGroup heading="Tasks">
                    {data!.tasks.map((task) => (
                      <CommandItem
                        key={`task-${task.id}`}
                        value={`task-${task.id}`}
                        onSelect={() =>
                          handleSelect(
                            `/${task.workspace_slug}/${task.board_slug}?task=${task.id}`,
                          )
                        }
                      >
                        <SquareCheckBig className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground">
                          {task.key}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{task.title}</span>
                        <span
                          className="ml-auto shrink-0 text-[11px]"
                          style={{
                            color: PRIORITY_CONFIG[task.priority].color,
                          }}
                        >
                          {PRIORITY_CONFIG[task.priority].label}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {(data?.tasks?.length ?? 0) > 0 &&
                  (data?.boards?.length ?? 0) > 0 && <CommandSeparator />}

                {(data?.boards?.length ?? 0) > 0 && (
                  <CommandGroup heading="Boards">
                    {data!.boards.map((board) => (
                      <CommandItem
                        key={`board-${board.id}`}
                        value={`board-${board.id}`}
                        onSelect={() =>
                          handleSelect(
                            `/${workspaceSlug}/${board.slug}`,
                          )
                        }
                      >
                        <div
                          className="h-4 w-4 shrink-0 rounded-sm"
                          style={{
                            backgroundColor: board.color ?? '#6b7280',
                          }}
                        >
                          <Kanban className="h-full w-full p-0.5 text-white" />
                        </div>
                        <span>{board.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {(data?.boards?.length ?? 0) > 0 &&
                  (data?.users?.length ?? 0) > 0 && <CommandSeparator />}

                {(data?.users?.length ?? 0) > 0 && (
                  <CommandGroup heading="People">
                    {data!.users.map((user) => (
                      <CommandItem
                        key={`user-${user.id}`}
                        value={`user-${user.id}`}
                        onSelect={() =>
                          handleSelect(`/profile/${user.id}`)
                        }
                      >
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>{user.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
