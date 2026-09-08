import type { RequireMutationProps } from '@/components/types/require-mutation';
import useCanMutate from '@/hooks/use-can-mutate';

export default function RequireMutation({ mutation, children }: RequireMutationProps): JSX.Element {
  const allowed = useCanMutate(mutation);

  return <>{allowed ? children : null}</>;
}
