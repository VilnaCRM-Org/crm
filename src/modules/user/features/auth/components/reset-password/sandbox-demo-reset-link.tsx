import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import ROUTE_PATHS from '@/routes/route-paths';
import type { SandboxDemoResetLinkProps } from '@auth/types/password-recovery/components';

import InCardLink from './in-card-link';
import styles from './styles';

export default function SandboxDemoResetLink({
  email,
}: SandboxDemoResetLinkProps): JSX.Element | null {
  const { t } = useTranslation();
  const token = sandboxDemoSessionProvider.resetTokenFor(email);
  if (token === null) return null;

  return (
    <InCardLink
      to={`${ROUTE_PATHS.passwordReset}?token=${token}`}
      variant="text"
      sx={styles.demoResetLink}
    >
      {t('password_recovery.sent.demo_link')}
    </InCardLink>
  );
}
