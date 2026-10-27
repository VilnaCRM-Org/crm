import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import useSetupFormProps from '../../hooks/use-setup-form-props';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import ConfirmCodeField from './confirm-code-field';
import KeyBlock from './key-block';
import SetupGuide from './setup-guide';
import styles from './styles';

export default function SetupView(props: TwoFactorSettingsProps): JSX.Element {
  const { t } = useTranslation();
  const form = useSetupFormProps(props);
  const { settings, view, isSubmitting } = props;

  return (
    <UIForm<TwoFactorDto>
      onSubmit={form.onSubmit}
      defaultValues={form.defaultValues}
      isSubmitting={isSubmitting}
      error={form.error}
      errorAction={form.errorAction}
      title={form.title}
      titleComponent="h3"
      titleRef={form.titleRef}
      subtitle={form.subtitle}
      submitLabel={form.submitLabel}
      submittingLabel={form.submittingLabel}
    >
      <SetupGuide otpauthUri={settings.otpauthUri} />
      <KeyBlock secret={settings.secret} />
      <ConfirmCodeField view={view} disabled={isSubmitting} />
      <Box component="p" sx={styles.note}>
        {t('settings.two_factor.confirm.note')}
      </Box>
    </UIForm>
  );
}
