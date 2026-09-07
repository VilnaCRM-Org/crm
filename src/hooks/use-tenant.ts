import { useCallback } from 'react';

import type { TenantContextValue } from '@/hooks/types/access';
import useAccess from '@/hooks/use-access';
import accessCore from '@/lib/access/access-core';

export default function useTenant(): TenantContextValue {
  const { principal } = useAccess();
  const switchTenant = useCallback(
    (tenantId: string): boolean => {
      return accessCore.switchTenant(tenantId);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  return {
    activeTenantId: principal?.tenantId ?? null,
    tenants: principal?.tenants ?? [],
    switchTenant,
  };
}
