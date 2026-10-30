import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import type { ActivateHandler } from '@/components/types/ui-sidebar';

export default function useCloseOnNavigation(onNavigate: ActivateHandler): void {
  const { key } = useLocation();
  const handled = useRef(key);

  useEffect(() => {
    if (key === handled.current) return;
    handled.current = key;
    onNavigate();
  }, [key, onNavigate]);
}
