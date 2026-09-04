import type { RequirePermissionProps } from '@/components/types/require-permission';
import useCan from '@/hooks/use-can';

export default function RequirePermission({
  permission,
  fallback = null,
  children,
}: RequirePermissionProps): JSX.Element {
  const allowed = useCan(permission);

  return <>{allowed ? children : fallback}</>;
}
