import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';

export const CODE_FIELD_NAME = 'twoFactorCode';

export default function useChallengeFieldSync(state: TwoFactorChallengeState): void {
  const { setFocus, setValue } = useFormContext<TwoFactorDto>();
  const { value, focusRequest } = state;

  useEffect(() => {
    if (value === '') setValue(CODE_FIELD_NAME, '');
  }, [value, focusRequest, setValue]);

  useEffect(() => {
    if (focusRequest > 0) setFocus(CODE_FIELD_NAME);
  }, [focusRequest, setFocus]);
}
