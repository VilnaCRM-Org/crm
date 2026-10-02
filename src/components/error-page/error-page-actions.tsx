import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { ErrorPageProps } from '@/components/types/error-page';
import UIButton from '@/components/ui-button';
import ROUTE_PATHS from '@/routes/route-paths';

import actionStyles from './action-styles';
import ERROR_PAGE_VARIANTS, { ERROR_PAGE_ACTIONS_ID } from './error-page-variants';

const styles = actionStyles.build();

function RequestAccessButton(): JSX.Element {
  const { t } = useTranslation();

  return (
    <UIButton variant="contained" aria-disabled="true" disableFocusRipple sx={styles.contained}>
      {t('error_page.actions.request_access')}
    </UIButton>
  );
}

export default function ErrorPageActions({
  variant,
}: Pick<ErrorPageProps, 'variant'>): JSX.Element {
  const { t } = useTranslation();
  const { homeAppearance, requestAccess } = ERROR_PAGE_VARIANTS[variant];

  return (
    <Box id={ERROR_PAGE_ACTIONS_ID} sx={styles.row}>
      <UIButton
        to={ROUTE_PATHS.home}
        variant={homeAppearance}
        disableFocusRipple
        sx={styles[homeAppearance]}
      >
        {t('error_page.actions.home')}
      </UIButton>
      {requestAccess ? <RequestAccessButton /> : null}
    </Box>
  );
}
