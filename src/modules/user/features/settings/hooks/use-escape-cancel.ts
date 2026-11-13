import { type RefObject, useEffect, useRef } from 'react';

export default function useEscapeCancel(
  cancel: () => void,
  disabled: boolean
): RefObject<HTMLButtonElement | null> {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const view = cancelRef.current?.form;
      const fromView = event.target instanceof Node && view?.contains(event.target) === true;
      if (event.key === 'Escape' && !disabled && fromView) cancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return (): void => document.removeEventListener('keydown', onKeyDown);
  });

  return cancelRef;
}
