import { useCallback } from 'react';

export default function useFocusOnMount<T extends HTMLElement = HTMLElement>(): (
  node: T | null
) => void {
  return useCallback((node: T | null) => {
    node?.focus();
  }, []);
}
