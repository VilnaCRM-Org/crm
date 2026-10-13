import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
import type { JSX } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import passwordValidator from '@auth/components/form-section/validations/password';
import type {
  PasswordPolicyRulesProps,
  PasswordRuleItemProps,
  PasswordRuleLabels,
} from '@auth/types/components/password-policy-rules';

import styles from './password-policy-rules-styles';

function PasswordRuleItem({ label, met }: PasswordRuleItemProps): JSX.Element {
  const { t } = useTranslation();
  const Icon = met ? CheckIcon : CloseIcon;

  return (
    <Box component="li" sx={met ? styles.met : styles.unmet}>
      <Icon aria-hidden="true" sx={styles.icon} />
      <span>{label}</span>{' '}
      <Box component="span" sx={styles.visuallyHidden}>
        {met ? t('password_policy.state.met') : t('password_policy.state.unmet')}
      </Box>
    </Box>
  );
}

function useRuleLabels(): PasswordRuleLabels {
  const { t } = useTranslation();
  return {
    invalidLength: t('password_policy.rules.length'),
    numberRequired: t('password_policy.rules.digit'),
    uppercaseRequired: t('password_policy.rules.uppercase'),
    lowercaseRequired: t('password_policy.rules.lowercase'),
    fieldRequired: '',
  };
}

export default function PasswordPolicyRules({ id, name }: PasswordPolicyRulesProps): JSX.Element {
  const value: unknown = useWatch({ name });
  const labels = useRuleLabels();
  const { items } = passwordValidator.evaluate(typeof value === 'string' ? value : '');

  return (
    <Box component="ul" id={id} sx={styles.list}>
      {items.map(({ key, met }) => (
        <PasswordRuleItem key={key} label={labels[key]} met={met} />
      ))}
    </Box>
  );
}
