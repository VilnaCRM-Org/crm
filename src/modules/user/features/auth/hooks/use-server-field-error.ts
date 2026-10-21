import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import type { ServerFieldErrorProps } from '@auth/types/components/server-field-error';

export default function useServerFieldError({ name, message }: ServerFieldErrorProps): void {
  const { setError, setFocus, clearErrors, getFieldState } = useFormContext();

  useEffect(() => {
    if (message !== null) {
      setError(name, { type: 'server', message });
      setFocus(name);
    } else if (getFieldState(name).error?.type === 'server') {
      clearErrors(name);
    }
  }, [message, name, setError, setFocus, clearErrors, getFieldState]);
}
