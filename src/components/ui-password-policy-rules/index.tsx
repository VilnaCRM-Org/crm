import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
import type { JSX } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type {
  PasswordRuleItemProps,
  PasswordRuleLabels,
  UIPasswordPolicyRulesProps,
} from '@/components/types/ui-password-policy-rules';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import en from './i18n/en.json';
import uk from './i18n/uk.json';
import styles from './styles';

lazyCatalogLoader.register(i18n, { en, uk });

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
  };
}

export default function UIPasswordPolicyRules({
  id,
  name,
  evaluate,
}: UIPasswordPolicyRulesProps): JSX.Element {
  const value: unknown = useWatch({ name });
  const labels = useRuleLabels();
  const { items } = evaluate(typeof value === 'string' ? value : '');

  return (
    <Box component="ul" role="list" id={id} sx={styles.list}>
      {items.map(({ key, met }) => (
        <PasswordRuleItem key={key} label={labels[key]} met={met} />
      ))}
    </Box>
  );
}
