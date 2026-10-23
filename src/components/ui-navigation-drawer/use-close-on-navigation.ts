import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import type { ActivateHandler } from '@/components/types/ui-sidebar';

export default function useCloseOnNavigation(onNavigate: ActivateHandler): void {
  const { pathname } = useLocation();
  const opened = useRef(pathname);

  useEffect(() => {
    if (pathname !== opened.current) onNavigate();
  }, [pathname, onNavigate]);
}
