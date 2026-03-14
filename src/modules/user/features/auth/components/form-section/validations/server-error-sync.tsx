import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { RegisterUserDto } from '../../../types/credentials';

type ServerErrorSyncProps = {
  field: keyof RegisterUserDto;
  message: string | null;
};

export default function ServerErrorSync({ field, message }: ServerErrorSyncProps): null {
  const { setError, clearErrors, getFieldState } = useFormContext<RegisterUserDto>();

  useEffect(() => {
    if (message) {
      setError(field, { type: 'server', message });
      return;
    }

    const currentError = getFieldState(field).error;
    if (currentError?.type === 'server') {
      clearErrors(field);
    }
  }, [message, field, setError, clearErrors, getFieldState]);

  return null;
}
