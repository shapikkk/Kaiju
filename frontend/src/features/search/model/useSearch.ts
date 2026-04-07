import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search';
import type { SearchResults } from '@shared/types';

export function useWorkspaceSearch(slug: string, query: string) {
  return useQuery<SearchResults>({
    queryKey: ['search', slug, query],
    queryFn: () => searchApi.workspace(slug, query),
    enabled: !!slug && query.length >= 2,
    staleTime: 30_000,
    placeholderData: { tasks: [], boards: [], users: [] },
  });
}
