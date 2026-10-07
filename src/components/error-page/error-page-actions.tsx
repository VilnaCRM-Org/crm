import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { ErrorPageProps } from '@/components/types/error-page';
import UIButton from '@/components/ui-button';
import ROUTE_PATHS from '@/routes/route-paths';

import actionStyles from './action-styles';
import ERROR_PAGE_MEDIA from './error-page-media';
import ERROR_PAGE_VARIANTS, { ERROR_PAGE_ACTIONS_ID } from './error-page-variants';

const styles = actionStyles.build();

function RequestAccessButton(): JSX.Element {
  const { t } = useTranslation();

  return (
    <UIButton
      variant="contained"
      aria-disabled="true"
      disableFocusRipple
      sx={[styles.contained, styles.stacked]}
    >
      {t('error_page.actions.request_access')}
    </UIButton>
  );
}

export default function ErrorPageActions({
  variant,
}: Pick<ErrorPageProps, 'variant'>): JSX.Element {
  const { t } = useTranslation();
  const stacked = useMediaQuery(ERROR_PAGE_MEDIA.mobile, { noSsr: true });
  const { homeAppearance, requestAccess } = ERROR_PAGE_VARIANTS[variant];
  const home = (
    <UIButton
      to={ROUTE_PATHS.home}
      variant={homeAppearance}
      disableFocusRipple
      sx={[styles[homeAppearance], requestAccess && styles.stacked]}
    >
      {t('error_page.actions.home')}
    </UIButton>
  );
  const request = requestAccess ? <RequestAccessButton /> : null;

  return (
    <Box id={ERROR_PAGE_ACTIONS_ID} sx={styles.row}>
      {stacked ? request : home}
      {stacked ? home : request}
    </Box>
  );
}
