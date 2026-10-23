import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { NavigationItemsProps } from '@/components/types/ui-navigation-list';

import NavigationGroup from './navigation-group';
import NavigationRow from './navigation-row';
import styles from './styles';

export default function NavigationExpandedItems({
  layout,
  items,
  currentId,
}: NavigationItemsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {items.items.map((item) =>
        'children' in item ? (
          <NavigationGroup key={item.id} layout={layout} group={item} currentId={currentId} />
        ) : (
          <Box component="li" key={item.id} sx={styles.item}>
            <NavigationRow
              layout={layout}
              variant="item"
              id={item.id}
              label={t(item.labelKey)}
              icon={item.icon}
              href={item.href}
              current={currentId === item.id}
            />
          </Box>
        )
      )}
    </>
  );
}
