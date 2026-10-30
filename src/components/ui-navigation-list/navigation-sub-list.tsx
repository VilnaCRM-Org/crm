import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { NavigationSubListProps } from '@/components/types/ui-navigation-list';

import groupStyles from './group-styles';
import NavigationRow from './navigation-row';
import styles from './styles';

export default function NavigationSubList({
  layout,
  id,
  leaves,
  currentId,
}: NavigationSubListProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box component="ol" role="list" id={id} sx={groupStyles.subList}>
      {leaves.items.map((leaf) => (
        <Box component="li" key={leaf.id} sx={styles.item}>
          <NavigationRow
            layout={layout}
            variant="sub"
            id={leaf.id}
            label={t(leaf.labelKey)}
            href={leaf.href}
            current={currentId === leaf.id}
          />
        </Box>
      ))}
    </Box>
  );
}
