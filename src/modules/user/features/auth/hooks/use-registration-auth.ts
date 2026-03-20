import { useMemo } from 'react';

import useRegistrationRequest from '@/modules/user/features/auth/hooks/use-registration-request';
import { createAuthClients } from '@/modules/user/features/auth/repositories';

export default function useRegistrationAuth(): ReturnType<typeof useRegistrationRequest> {
  const registrationAPI = useMemo(() => createAuthClients().registrationAPI, []);
  return useRegistrationRequest(registrationAPI);
}
