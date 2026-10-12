import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import ERROR_PAGE_VARIANTS, {
  ERROR_PAGE_TITLE_ID,
} from '@/components/error-page/config/error-page-variants';
import cardStyles from '@/components/error-page/styles/card-styles';
import type { ErrorPageProps } from '@/components/types/error-page';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import ErrorPageActions from './error-page-actions';

const styles = cardStyles.build();

export default function ErrorPageCard({ variant }: Pick<ErrorPageProps, 'variant'>): JSX.Element {
  const { t } = useTranslation();
  const focusTitle = useFocusOnMount<HTMLHeadingElement>();
  const { titleKey, codeKey, descriptionKey } = ERROR_PAGE_VARIANTS[variant];
  const rhythm = cardStyles.rhythm(ERROR_PAGE_VARIANTS[variant]);

  return (
    <Box sx={[styles.card, rhythm.card]}>
      <Box component="h1" id={ERROR_PAGE_TITLE_ID} tabIndex={-1} ref={focusTitle} sx={styles.title}>
        {t(titleKey)}
      </Box>
      <Box component="p" sx={styles.statusCode}>
        {t(codeKey)}
      </Box>
      <Box component="p" sx={[styles.description, rhythm.description]}>
        {t(descriptionKey)}
      </Box>
      <ErrorPageActions variant={variant} />
    </Box>
  );
}
