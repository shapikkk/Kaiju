import apiClient from './client';
import type { SearchResults } from '@/types';

export const searchApi = {
  workspace: async (slug: string, q: string): Promise<SearchResults> => {
    const { data } = await apiClient.get<SearchResults>(
      `/workspaces/${slug}/search`,
      { params: { q } },
    );
    return data;
  },
};
