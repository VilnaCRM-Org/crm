import type { UserMenuState } from '../src/modules/user/features/settings/types/hooks/use-user-menu';

import { noop } from './story-callbacks';

export const closedMenu: UserMenuState = {
  open: false,
  chip: { current: null },
  show: noop,
  close: noop,
  dismiss: noop,
  chipKeyDown: noop,
  menuKeyDown: noop,
};

export const openMenu: UserMenuState = { ...closedMenu, open: true };
