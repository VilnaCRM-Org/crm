import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIPasswordField from '@/components/ui-password-field';
import UIPasswordPolicyRules from '@/components/ui-password-policy-rules';
import UITypography from '@/components/ui-typography';

import type {
  ChangePasswordProps,
  CurrentPasswordProps,
} from '../../types/components/change-password';
import type { ProfileFormValues } from '../../types/user-profile/profile-form-values';
import styles from '../profile-form/styles';

const HINT_ID = 'new-password-hint';

const RULES_ID = 'new-password-rules';

function CurrentPassword({ rules, busy }: CurrentPasswordProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <UIPasswordField<ProfileFormValues>
      name="currentPassword"
      label={t('settings.profile.current_password')}
      placeholder={t('sign_in.form.password_input.placeholder')}
      autoComplete="current-password"
      rules={rules.currentPassword}
      readOnly={busy}
      sx={styles.field}
    />
  );
}

export default function ChangePassword({
  rules,
  evaluate,
  busy,
}: ChangePasswordProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <UITypography component="h2" sx={styles.sectionTitle}>
        {t('settings.profile.sections.password')}
      </UITypography>
      <CurrentPassword rules={rules} busy={busy} />
      <UIPasswordField<ProfileFormValues>
        name="newPassword"
        label={t('settings.profile.new_password')}
        placeholder={t('sign_up.form.password_input.placeholder')}
        autoComplete="new-password"
        describedBy={`${HINT_ID} ${RULES_ID}`}
        rules={rules.newPassword}
        readOnly={busy}
        sx={styles.field}
      />
      <UITypography id={HINT_ID} sx={styles.hint}>
        {t('settings.profile.new_password_hint')}
      </UITypography>
      <UIPasswordPolicyRules id={RULES_ID} name="newPassword" evaluate={evaluate} />
    </>
  );
}
