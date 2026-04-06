import apiClient from '@shared/lib/api/client';

export const verificationApi = {
  verify: async (params: {
    id: string;
    hash: string;
    expires: string;
    signature: string;
  }): Promise<{ message: string }> => {
    const { data } = await apiClient.get(
      `/email/verify/${params.id}/${params.hash}`,
      { params: { expires: params.expires, signature: params.signature } },
    );
    return data;
  },

  resend: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/email/verification-notification');
    return data;
  },
};
