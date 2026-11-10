import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UINavigationListProps } from '@/components/types/ui-navigation-list';

import NavigationExpandedItems from './navigation-expanded-items';
import NavigationRailItems from './navigation-rail-items';
import NavigationSignOut from './navigation-sign-out';
import styles from './styles';
import useCurrentNavigationItem from './use-current-navigation-item';
import useGroupDisclosure from './use-group-disclosure';

export default function UINavigationList({
  layout,
  variant,
  items,
  signOut,
}: UINavigationListProps): JSX.Element {
  const currentId = useCurrentNavigationItem(items);
  const disclosure = useGroupDisclosure();
  const scrolls = layout !== 'drawer';

  return (
    <Box
      component="ol"
      role="list"
      tabIndex={scrolls ? -1 : undefined}
      sx={styles.list[scrolls ? variant : 'drawer']}
    >
      {variant === 'rail' && layout !== 'drawer' ? (
        <NavigationRailItems layout={layout} items={items} currentId={currentId} />
      ) : (
        <NavigationExpandedItems
          layout={layout}
          items={items}
          currentId={currentId}
          disclosure={disclosure}
        />
      )}
      <NavigationSignOut layout={layout} variant={variant} onSignOut={signOut} />
    </Box>
  );
}
