import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { matchPath, useLocation } from 'react-router';

import type { ComingSoonContentProps } from '@/components/types/coming-soon';
import usePageTitle from '@/hooks/use-page-title';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import ComingSoonCard from './coming-soon-card';
import comingSoonSections from './coming-soon-sections';
import en from './i18n/en.json';
import uk from './i18n/uk.json';
import styles from './styles';

lazyCatalogLoader.register(i18n, { en, uk });

const layoutSheet = styles.build();

function ComingSoonContent({ section }: ComingSoonContentProps): JSX.Element {
  usePageTitle(section.headingKey);

  return (
    <Box sx={layoutSheet.page}>
      <Box sx={layoutSheet.frame}>
        <ComingSoonCard headingKey={section.headingKey} />
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
