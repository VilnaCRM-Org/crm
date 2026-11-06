import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { matchPath, useLocation } from 'react-router';

import cardStyles from '@/components/error-page/styles/card-styles';
import type { ComingSoonContentProps } from '@/components/types/coming-soon';
import usePageTitle from '@/hooks/use-page-title';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import ComingSoonHomeLink from './coming-soon-home-link';
import comingSoonSections from './coming-soon-sections';
import en from './i18n/en.json';
import uk from './i18n/uk.json';
import styles from './styles';

lazyCatalogLoader.register(i18n, { en, uk });

const cardSheet = cardStyles.build();
const layoutSheet = styles.build();

function ComingSoonContent({ section }: ComingSoonContentProps): JSX.Element {
  const { t } = useTranslation();
  usePageTitle(section.headingKey);

  return (
    <Box sx={layoutSheet.page}>
      <Box sx={layoutSheet.frame}>
        <Box sx={cardSheet.card}>
          <Box component="h1" sx={cardSheet.title}>
            {t(section.headingKey)}
          </Box>
          <Box component="p" sx={cardSheet.description}>
            {t('coming_soon.message')}
          </Box>
          <ComingSoonHomeLink />
        </Box>
      </Box>
    </Box>
  );
}

export default function ComingSoonPage(): JSX.Element | null {
  const { pathname } = useLocation();
  const section = comingSoonSections.items.find(
    ({ path }) => matchPath({ path }, pathname) !== null
  );

  return section === undefined ? null : <ComingSoonContent section={section} />;
}
