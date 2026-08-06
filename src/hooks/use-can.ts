import useAccess from '@/hooks/use-access';
import permissionResolver from '@/lib/access/permission-resolver';
import type { Permission } from '@/lib/types/access/permission';

export default function useCan(permission: Permission): boolean {
  return permissionResolver.can(useAccess().principal, permission);
}
