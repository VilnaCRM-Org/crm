import { useEffect } from 'react';

export default function useEscapeCancel(cancel: () => void, disabled: boolean): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !disabled) cancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return (): void => document.removeEventListener('keydown', onKeyDown);
  });
}
