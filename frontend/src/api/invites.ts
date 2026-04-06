import apiClient from '@shared/lib/api/client';

export interface AcceptInviteResponse {
  message: string;
  workspace_slug: string;
}

export const invitesApi = {
  accept: async (token: string): Promise<AcceptInviteResponse> => {
    const { data } = await apiClient.post<AcceptInviteResponse>(
      `/invites/${token}/accept`,
    );
    return data;
  },
  acceptLink: async (token: string): Promise<{ slug: string }> => {
    const { data } = await apiClient.post<{ slug: string }>(
      `/invites/link/${token}/accept`,
    );
    return data;
  },
};
