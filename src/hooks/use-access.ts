import { useContext } from 'react';

import useAccessSnapshot from '@/hooks/use-access-snapshot';
import type { AccessSnapshot } from '@/lib/types/access/principal';
import AccessContext from '@/providers/access-context';

export default function useAccess(): AccessSnapshot {
  const provided = useContext(AccessContext);
  const live = useAccessSnapshot();

  return provided ?? live;
}
