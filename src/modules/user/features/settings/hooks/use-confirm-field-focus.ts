import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import type { TwoFactorSettingsViewState } from '../types/two-factor/settings-view';

export const CONFIRM_FIELD_NAME = 'twoFactorCode';

export default function useConfirmFieldFocus(
  view: TwoFactorSettingsViewState,
  clearsWrongCode = false
): void {
  const { setFocus, setValue } = useFormContext<TwoFactorDto>();

  useEffect(() => {
    if (clearsWrongCode && view.fieldError === 'invalid_code') setValue(CONFIRM_FIELD_NAME, '');
    if (view.fieldError !== null) setFocus(CONFIRM_FIELD_NAME);
  }, [view, clearsWrongCode, setFocus, setValue]);
}
