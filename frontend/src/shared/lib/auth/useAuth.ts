import { useContext } from 'react';
import { AuthContext } from './auth-provider';
import { authApi } from './auth-api';
import type { User } from '@shared/types';

export { authApi };

export function useCurrentUser(): User | null {
  return useContext(AuthContext).user;
}

export function useAuth() {
  return useContext(AuthContext);
}
