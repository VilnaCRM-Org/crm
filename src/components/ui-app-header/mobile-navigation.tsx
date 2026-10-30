import { type JSX, useId } from 'react';

import type { MobileNavigationProps } from '@/components/types/ui-app-header';
import UINavigationDrawer from '@/components/ui-navigation-drawer';

import MenuToggleButton from './menu-toggle-button';
import useDrawerFocus from './use-drawer-focus';
import useDrawerOpen from './use-drawer-open';

export default function MobileNavigation({
  items,
  signOut,
  avatar,
}: MobileNavigationProps): JSX.Element {
  const dialogId = useId();
  const { open, restore, show, dismiss, leave } = useDrawerOpen();
  const attachBurger = useDrawerFocus({ open, restore });

  return (
    <>
      <MenuToggleButton open={open} controls={dialogId} onToggle={show} ref={attachBurger} />
      <UINavigationDrawer
        open={open}
        id={dialogId}
        items={items}
        signOut={signOut}
        onClose={dismiss}
        onNavigate={leave}
        avatar={avatar}
      />
    </>
  );
}
