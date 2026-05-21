import { useMemo } from 'react';

import { createAuthClients, type AuthClients } from '../repositories';

export default function useAuthStore(): AuthClients {
  return useMemo(() => createAuthClients(), []);
}
