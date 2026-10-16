import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import type {
  ServerFieldErrorForm,
  ServerFieldErrorProps,
} from '@/components/types/ui-server-field-error';

function syncServerError(
  form: ServerFieldErrorForm,
  { name, message, focus = true }: ServerFieldErrorProps
): void {
  if (message !== null) {
    form.setError(name, { type: 'server', message });
    if (focus) form.setFocus(name);
  } else if (form.getFieldState(name).error?.type === 'server') {
    form.clearErrors(name);
  }
}

export default function useServerFieldError({ name, message, focus }: ServerFieldErrorProps): void {
  const { setError, setFocus, clearErrors, getFieldState } = useFormContext();

  useEffect(() => {
    syncServerError({ setError, setFocus, clearErrors, getFieldState }, { name, message, focus });
  }, [message, name, focus, setError, setFocus, clearErrors, getFieldState]);
}
