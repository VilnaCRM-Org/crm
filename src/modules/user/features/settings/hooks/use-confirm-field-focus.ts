import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import type { TwoFactorSettingsViewState } from '../types/two-factor/settings-view';

export const CONFIRM_FIELD_NAME = 'twoFactorCode';

export default function useConfirmFieldFocus(view: TwoFactorSettingsViewState): void {
  const { setFocus } = useFormContext<TwoFactorDto>();

  useEffect(() => {
    if (view.fieldError !== null) setFocus(CONFIRM_FIELD_NAME);
  }, [view, setFocus]);
}
