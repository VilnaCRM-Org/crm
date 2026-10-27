import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useLinkClickHandler } from 'react-router';

import { ERROR_PAGE_ACTIONS_ID } from '@/components/error-page/config/error-page-variants';
import actionStyles from '@/components/error-page/styles/action-styles';
import UIButton from '@/components/ui-button';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';

const styles = actionStyles.build();

const FOCUS_ON_ARRIVAL: RedirectNavigationState = { focusMain: true };

export default function ComingSoonHomeLink(): JSX.Element {
  const { t } = useTranslation();
  const handleClick = useLinkClickHandler<HTMLButtonElement>(ROUTE_PATHS.home, {
    state: FOCUS_ON_ARRIVAL,
  });

  return (
    <Box id={ERROR_PAGE_ACTIONS_ID} sx={styles.row}>
      <UIButton
        href={ROUTE_PATHS.home}
        onClick={handleClick}
        variant="contained"
        disableFocusRipple
        sx={styles.contained}
      >
        {t('coming_soon.home_link')}
      </UIButton>
    </Box>
  );
}
