import { useEffect } from 'react';

import type { ActivateHandler } from '@/components/types/ui-sidebar';

export default function useDocumentEscape(active: boolean, onEscape: ActivateHandler): void {
  useEffect(() => {
    if (!active) return undefined;

    const listen = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onEscape();
    };

    document.addEventListener('keydown', listen);

    return (): void => document.removeEventListener('keydown', listen);
  }, [active, onEscape]);
}
