import type { AccessProviderProps } from '@/components/types/providers';
import useAccessSnapshot from '@/hooks/use-access-snapshot';

import AccessContext from './access-context';

export default function AccessProvider({ children }: AccessProviderProps): JSX.Element {
  const snapshot = useAccessSnapshot();

  return <AccessContext.Provider value={snapshot}>{children}</AccessContext.Provider>;
}
