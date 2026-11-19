import useFocusOnMount from '@/utils/use-focus-on-mount';

const IGNORE = (): void => undefined;

export default function useOptionalFocus<T extends HTMLElement>(
  enabled: boolean
): (node: T | null) => void {
  const focusOnMount = useFocusOnMount<T>();
  return enabled ? focusOnMount : IGNORE;
}
