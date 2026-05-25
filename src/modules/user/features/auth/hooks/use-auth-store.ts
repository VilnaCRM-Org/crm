import { useMemo } from 'react';

import createAuthClients from '@/stores/auth-clients';

import { AuthClients } from '../repositories';

export default function useAuthStore(): AuthClients {
  return useMemo(() => createAuthClients(), []);
}
