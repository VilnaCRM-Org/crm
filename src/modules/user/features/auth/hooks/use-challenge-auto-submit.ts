import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import { CODE_FIELD_NAME } from '@auth/hooks/use-challenge-field-sync';

const COMPLETE_CODE = /^\d{6}$/u;

export default function useChallengeAutoSubmit(onComplete: () => void): void {
  const { control } = useFormContext<TwoFactorDto>();
  const value = useWatch({ control, name: CODE_FIELD_NAME });
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (COMPLETE_CODE.test(value)) onComplete();
  }, [value, onComplete]);
}
