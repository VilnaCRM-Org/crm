import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { JSX } from 'react';
import { useLinkClickHandler } from 'react-router';

import type { NavigationRowProps } from '@/components/types/ui-navigation-list';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';

import NavigationRowLabel from './navigation-row-label';
import railStyles from './rail-styles';
import styles from './styles';

const FOCUS_ON_ARRIVAL: RedirectNavigationState = { focusMain: true };

const iconStyleOf = ({ layout, variant, id, shape }: NavigationRowProps): SxProps<Theme> =>
  ({
    item: id === 'signOut' ? styles.icon.action : styles.icon[layout],
    sub: styles.icon[layout],
    rail: railStyles.railIcon[shape ?? 'desktop'],
  })[variant];

const actionOf = (layout: NavigationRowProps['layout']): SxProps<Theme> =>
  layout === 'drawer' ? styles.actionDrawer : styles.action;

const sxOf = ({ layout, variant, id, shape, open }: NavigationRowProps): SxProps<Theme> =>
  ({
    item:
      id === 'signOut'
        ? actionOf(layout)
        : {
            ...styles.row[layout],
            ...styles.rowById[layout][id],
            ...(open ? styles.rowOpen[layout] : {}),
          },
    sub: styles.sub[layout],
    rail: railStyles.rail[shape ?? 'desktop'],
  })[variant];

export default function NavigationRow(props: NavigationRowProps): JSX.Element {
  const { variant, label, icon: Icon, href, current, onActivate, grouped, layout } = props;
  const handleLink = useLinkClickHandler<HTMLAnchorElement>(href ?? ROUTE_PATHS.home, {
    state: FOCUS_ON_ARRIVAL,
  });
  const content = (
    <>
      {Icon && (
        <Box component={Icon} aria-hidden="true" focusable="false" sx={iconStyleOf(props)} />
      )}
      <NavigationRowLabel layout={layout} variant={variant} label={label} grouped={grouped} />
    </>
  );

  return href === undefined ? (
    <Box component="button" type="button" onClick={onActivate} sx={sxOf(props)}>
      {content}
    </Box>
  ) : (
    <Box
      component="a"
      href={href}
      aria-current={current ? 'page' : undefined}
      onClick={handleLink}
      sx={sxOf(props)}
    >
      {content}
    </Box>
  );
}
