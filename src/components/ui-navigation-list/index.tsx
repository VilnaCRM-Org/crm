import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UINavigationListProps } from '@/components/types/ui-navigation-list';
import useOnceCallback from '@/hooks/use-once-callback';

import NavigationExpandedItems from './navigation-expanded-items';
import NavigationRailItems from './navigation-rail-items';
import NavigationSignOut from './navigation-sign-out';
import styles from './styles';
import useAvailableNavigationItems from './use-available-items';
import useCurrentNavigationItem from './use-current-navigation-item';

export default function UINavigationList({
  layout,
  variant,
  items,
  signOut,
}: UINavigationListProps): JSX.Element {
  const available = useAvailableNavigationItems(items);
  const currentId = useCurrentNavigationItem(available);
  const onSignOut = useOnceCallback(signOut);
  const Items = variant === 'rail' ? NavigationRailItems : NavigationExpandedItems;

  return (
    <Box component="ol" sx={styles.list[variant]}>
      <Items layout={layout} items={available} currentId={currentId} />
      <NavigationSignOut layout={layout} variant={variant} onSignOut={onSignOut} />
    </Box>
  );
}
