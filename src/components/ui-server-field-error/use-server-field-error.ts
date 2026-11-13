import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import type {
  ServerFieldErrorClearForm,
  ServerFieldErrorForm,
  ServerFieldErrorProps,
} from '@/components/types/ui-server-field-error';

function clearOwnServerError(form: ServerFieldErrorClearForm, name: string): void {
  if (form.getFieldState(name).error?.type === 'server') form.clearErrors(name);
}

function syncServerError(
  form: ServerFieldErrorForm,
  { name, message, focus = true }: ServerFieldErrorProps
): void {
  if (message === null) {
    clearOwnServerError(form, name);
    return;
  }
  form.setError(name, { type: 'server', message });
  if (focus) form.setFocus(name);
}

export default function useServerFieldError({
  name,
  message,
  occurrence,
  focus,
}: ServerFieldErrorProps): void {
  const { setError, setFocus, clearErrors, getFieldState } = useFormContext();

  useEffect(() => {
    syncServerError(
      { setError, setFocus, clearErrors, getFieldState },
      { name, message, occurrence, focus }
    );
  }, [message, occurrence, name, focus, setError, setFocus, clearErrors, getFieldState]);

  useEffect(
    () => (): void => {
      clearOwnServerError({ clearErrors, getFieldState }, name);
    },
    [name, clearErrors, getFieldState]
  );
}
