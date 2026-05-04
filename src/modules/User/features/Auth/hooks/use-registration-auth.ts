import { useMemo } from 'react';

import useRegistrationRequest from '@/modules/User/features/Auth/hooks/use-registration-request';
import { createAuthClients } from '@/modules/User/features/Auth/repositories';

export default function useRegistrationAuth(): ReturnType<typeof useRegistrationRequest> {
  const registrationAPI = useMemo(() => createAuthClients().registrationAPI, []);
  return useRegistrationRequest(registrationAPI);
}
