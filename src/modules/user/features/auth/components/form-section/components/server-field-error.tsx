import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import type { ServerFieldErrorProps } from '@auth/types/components/server-field-error';

export default function ServerFieldError({ name, message }: ServerFieldErrorProps): null {
  const { setError, setFocus } = useFormContext();

  useEffect(() => {
    if (message === null) return;
    setError(name, { type: 'server', message });
    setFocus(name);
  }, [message, name, setError, setFocus]);

  return null;
}
