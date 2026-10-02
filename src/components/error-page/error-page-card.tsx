import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { ErrorPageProps } from '@/components/types/error-page';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import cardStyles from './card-styles';
import ErrorPageActions from './error-page-actions';
import ERROR_PAGE_VARIANTS, { ERROR_PAGE_TITLE_ID } from './error-page-variants';

const styles = cardStyles.build();

export default function ErrorPageCard({ variant }: Pick<ErrorPageProps, 'variant'>): JSX.Element {
  const { t } = useTranslation();
  const focusTitle = useFocusOnMount<HTMLHeadingElement>();
  const { titleKey, codeKey, descriptionKey } = ERROR_PAGE_VARIANTS[variant];

  return (
    <Box sx={styles.card}>
      <Box component="h1" id={ERROR_PAGE_TITLE_ID} tabIndex={-1} ref={focusTitle} sx={styles.title}>
        {t(titleKey)}
      </Box>
      <Box component="p" sx={styles.statusCode}>
        {t(codeKey)}
      </Box>
      <Box component="p" sx={styles.description}>
        {t(descriptionKey)}
      </Box>
      <ErrorPageActions variant={variant} />
    </Box>
  );
}
