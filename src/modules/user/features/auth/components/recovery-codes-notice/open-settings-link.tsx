import type { JSX, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLinkClickHandler } from 'react-router';

import UILink from '@/components/ui-link';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import type { OpenSettingsLinkProps } from '@auth/types/two-factor/recovery-codes-notice';

import styles from './styles';

const FOCUS_ON_ARRIVAL: RedirectNavigationState = { focusMain: true };

export default function OpenSettingsLink({ onDismiss }: OpenSettingsLinkProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useLinkClickHandler<HTMLAnchorElement>(ROUTE_PATHS.settings, {
    state: FOCUS_ON_ARRIVAL,
  });
  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    navigate(event);
    if (event.defaultPrevented) onDismiss();
  };

  return (
    <UILink href={ROUTE_PATHS.settings} onClick={handleClick} sx={styles.link}>
      {t('recovery_codes_notice.open_settings')}
    </UILink>
  );
}
