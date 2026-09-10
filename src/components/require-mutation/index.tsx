import { useLocation } from 'react-router-dom';

import type { RequireMutationProps } from '@/components/types/require-mutation';
import useCanMutate from '@/hooks/use-can-mutate';
import useDenialAudit from '@/hooks/use-denial-audit';
import usePrincipal from '@/hooks/use-principal';

// The board's MutationAccessGuard: a control the principal may not invoke is absent from the
// tree, not disabled — a disabled control still announces a capability the server would refuse.
// There is deliberately no fallback prop for the same reason.
export default function RequireMutation({ mutation, children }: RequireMutationProps): JSX.Element {
  const principal = usePrincipal();
  const allowed = useCanMutate(mutation);
  const { pathname } = useLocation();
  const refusal =
    principal !== null && !allowed ? JSON.stringify([principal.id, mutation, pathname]) : null;

  useDenialAudit(refusal, mutation, pathname);

  return <>{allowed ? children : null}</>;
}
