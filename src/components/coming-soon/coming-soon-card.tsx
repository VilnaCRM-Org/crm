import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import cardStyles from '@/components/error-page/styles/card-styles';
import type { ComingSoonCardProps } from '@/components/types/coming-soon';

import ComingSoonHomeLink from './coming-soon-home-link';

const cardSheet = cardStyles.build();

export default function ComingSoonCard({ headingKey }: ComingSoonCardProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={cardSheet.card}>
      <Box component="h1" sx={cardSheet.title}>
        {t(headingKey)}
      </Box>
      <Box component="p" sx={cardSheet.description}>
        {t('coming_soon.message')}
      </Box>
      <ComingSoonHomeLink />
    </Box>
  );
}
