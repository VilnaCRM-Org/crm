import useAccess from '@/hooks/use-access';
import type { Principal } from '@/lib/types/access/principal';

export default function usePrincipal(): Principal | null {
  return useAccess().principal;
}
