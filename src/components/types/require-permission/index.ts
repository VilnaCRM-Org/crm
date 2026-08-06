import type { ReactNode } from 'react';

import type { Permission } from '@/lib/types/access/permission';

export interface RequirePermissionProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}
