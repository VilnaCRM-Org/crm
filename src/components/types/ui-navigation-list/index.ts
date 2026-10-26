import type { HTMLAttributes } from 'react';

import type {
  NavigationGroup,
  NavigationIcon,
  NavigationItemId,
  NavigationItemSet,
  NavigationLeafSet,
} from '../ui-app-shell/navigation-item';
import type { ActivateHandler, SidebarLayout, SignOutHandler } from '../ui-sidebar';

export type NavigationLayout = SidebarLayout | 'drawer';

export type NavigationListVariant = 'expanded' | 'rail';

export type NavigationRowVariant = 'item' | 'sub' | 'rail';

export type RailShape = 'desktop' | 'tablet' | 'tabletProducts' | 'tabletCompact' | 'action';

export type NavigationRowId = NavigationItemId | 'signOut';

export interface UINavigationListProps {
  readonly layout: NavigationLayout;
  readonly variant: NavigationListVariant;
  readonly items: NavigationItemSet;
  readonly signOut: SignOutHandler;
}

export interface NavigationRowProps {
  readonly layout: NavigationLayout;
  readonly variant: NavigationRowVariant;
  readonly id: NavigationRowId;
  readonly label: string;
  readonly icon?: NavigationIcon | undefined;
  readonly href?: string | undefined;
  readonly current?: boolean | undefined;
  readonly onActivate?: ActivateHandler | undefined;
  readonly shape?: RailShape | undefined;
  readonly open?: boolean | undefined;
  readonly grouped?: boolean | undefined;
}

export interface NavigationRowLabelProps {
  readonly layout: NavigationLayout;
  readonly variant: NavigationRowVariant;
  readonly label: string;
  readonly grouped?: boolean | undefined;
}

export interface NavigationRailItemProps {
  readonly layout: SidebarLayout;
  readonly id: NavigationRowId;
  readonly label: string;
  readonly icon: NavigationIcon;
  readonly href?: string | undefined;
  readonly current?: boolean | undefined;
  readonly onActivate?: ActivateHandler | undefined;
}

export interface NavigationGroupProps {
  readonly layout: NavigationLayout;
  readonly group: NavigationGroup;
  readonly currentId: NavigationItemId | null;
}

export interface NavigationGroupToggleProps {
  readonly layout: NavigationLayout;
  readonly expanded: boolean;
  readonly controls: string;
  readonly onToggle: ActivateHandler;
}

export interface GroupDisclosureState {
  readonly expanded: boolean;
  readonly toggle: ActivateHandler;
}

export type RailTooltipState = 'idle' | 'shown' | 'dismissed';

export type RailTooltipHandlers = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur'
>;

export interface RailTooltipBehavior {
  readonly visible: boolean;
  readonly handlers: RailTooltipHandlers;
}

export interface NavigationRailTooltipProps {
  readonly label: string;
  readonly shape: RailShape;
}

export interface NavigationSubListProps {
  readonly layout: NavigationLayout;
  readonly id: string;
  readonly leaves: NavigationLeafSet;
  readonly currentId: NavigationItemId | null;
}

export interface NavigationItemsProps {
  readonly layout: NavigationLayout;
  readonly items: NavigationItemSet;
  readonly currentId: NavigationItemId | null;
}

export interface NavigationSignOutProps {
  readonly layout: NavigationLayout;
  readonly variant: NavigationListVariant;
  readonly onSignOut: ActivateHandler;
}

export interface NavigationRailItemsProps {
  readonly layout: SidebarLayout;
  readonly items: NavigationItemSet;
  readonly currentId: NavigationItemId | null;
}

export interface NavigationDrawerSignOutProps {
  readonly onSignOut: ActivateHandler;
}

export interface NavigationSidebarSignOutProps {
  readonly layout: SidebarLayout;
  readonly variant: NavigationListVariant;
  readonly onSignOut: ActivateHandler;
}
