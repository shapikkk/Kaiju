import { useMutation } from '@tanstack/react-query';
import { verificationApi } from '../api/verification';

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (params: { id: string; hash: string; expires: string; signature: string }) =>
      verificationApi.verify(params),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => verificationApi.resend(),
  });
}
