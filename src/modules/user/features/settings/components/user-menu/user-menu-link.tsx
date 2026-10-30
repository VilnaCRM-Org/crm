import MenuItem from '@mui/material/MenuItem';
import { type JSX, type KeyboardEvent, type MouseEvent, useCallback } from 'react';
import { useLinkClickHandler } from 'react-router';

import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';

import type { UserMenuLinkProps } from '../../types/components/user-menu';

import styles from './styles';

const FOCUS_ON_ARRIVAL: RedirectNavigationState = { focusMain: true };

function activateOnSpace(event: KeyboardEvent<HTMLAnchorElement>): void {
  if (event.key !== ' ') return;
  event.preventDefault();
  event.currentTarget.click();
}

export default function UserMenuLink({ layout, label, onClose }: UserMenuLinkProps): JSX.Element {
  const handleLink = useLinkClickHandler<HTMLAnchorElement>(ROUTE_PATHS.settings, {
    state: FOCUS_ON_ARRIVAL,
  });
  const activate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>): void => {
      onClose();
      handleLink(event);
    },
    [onClose, handleLink]
  );

  return (
    <MenuItem
      component="a"
      href={ROUTE_PATHS.settings}
      disableRipple
      disableGutters
      onClick={activate}
      onKeyDown={activateOnSpace}
      sx={styles.item[layout]}
    >
      {label}
    </MenuItem>
  );
}
