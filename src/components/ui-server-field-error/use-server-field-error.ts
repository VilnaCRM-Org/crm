import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import type { ServerFieldErrorProps } from '@/components/types/ui-server-field-error';

export default function useServerFieldError({
  name,
  message,
  focus = true,
}: ServerFieldErrorProps): void {
  const { setError, setFocus, clearErrors, getFieldState } = useFormContext();

  useEffect(() => {
    if (message !== null) {
      setError(name, { type: 'server', message });
      if (focus) setFocus(name);
    } else if (getFieldState(name).error?.type === 'server') {
      clearErrors(name);
    }
  }, [message, name, focus, setError, setFocus, clearErrors, getFieldState]);
}
