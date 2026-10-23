import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { NavigationItemsProps } from '@/components/types/ui-navigation-list';

import NavigationRailItem from './navigation-rail-item';
import styles from './styles';

export default function NavigationRailItems({
  layout,
  items,
  currentId,
}: NavigationItemsProps): JSX.Element {
  const { t } = useTranslation();
  const leaves = items.items.flatMap((item) =>
    'children' in item ? [item, ...item.children.items] : [item]
  );

  return (
    <>
      {leaves.map((leaf) => (
        <Box component="li" key={leaf.id} sx={styles.item}>
          <NavigationRailItem
            layout={layout}
            id={leaf.id}
            label={t(leaf.labelKey)}
            icon={leaf.icon}
            href={leaf.href}
            current={currentId === leaf.id}
          />
        </Box>
      ))}
    </>
  );
}
