import { type JSX, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';

import type { ClearButtonProps } from '../../types/components/profile-form';
import type { ProfileFormValues } from '../../types/user-profile/profile-form-values';

import styles from './styles';

export default function ClearButton({ defaults, busy, onClear }: ClearButtonProps): JSX.Element {
  const { t } = useTranslation();
  const { reset } = useFormContext<ProfileFormValues>();

  const clear = useCallback((): void => {
    if (busy) return;
    reset(defaults);
    onClear();
  }, [busy, reset, defaults, onClear]);

  return (
    <UIButton
      type="button"
      variant="outlined"
      aria-disabled={busy ? 'true' : undefined}
      sx={styles.clearButton}
      onClick={clear}
    >
      {t('settings.profile.clear')}
    </UIButton>
  );
}
