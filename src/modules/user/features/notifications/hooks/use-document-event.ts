import { useEffect } from 'react';

import type { DocumentEventOptions } from '../types/bell-disclosure';

export default function useDocumentEvent<TType extends keyof DocumentEventMap>({
  active,
  type,
  listener,
  capture,
}: DocumentEventOptions<TType>): void {
  useEffect(() => {
    if (!active) return undefined;
    document.addEventListener(type, listener, capture);

    return (): void => document.removeEventListener(type, listener, capture);
  }, [active, type, listener, capture]);
}
