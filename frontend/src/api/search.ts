import apiClient from '@shared/lib/api/client';
import type { SearchResults } from "@shared/types";

export const searchApi = {
  workspace: async (slug: string, q: string): Promise<SearchResults> => {
    const { data } = await apiClient.get<SearchResults>(
      `/workspaces/${slug}/search`,
      { params: { q } },
    );
    return data;
  },
};
