import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { NavigationRailItemProps } from '@/components/types/ui-navigation-list';

import NavigationRailTooltip from './navigation-rail-tooltip';
import NavigationRow from './navigation-row';
import railStyles from './rail-styles';
import useRailTooltip from './use-rail-tooltip';

export default function NavigationRailItem(props: NavigationRailItemProps): JSX.Element {
  const { layout, id, label } = props;
  const { anchor, ref, handlers } = useRailTooltip();
  const shape = layout === 'desktop' ? 'desktop' : (railStyles.tabletShapes[id] ?? 'tablet');

  return (
    <Box
      ref={ref}
      sx={railStyles.railItem[shape]}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      onFocus={handlers.onFocus}
      onBlur={handlers.onBlur}
    >
      <NavigationRow
        layout={layout}
        variant="rail"
        shape={shape}
        id={id}
        label={label}
        icon={props.icon}
        href={props.href}
        current={props.current}
        onActivate={props.onActivate}
      />
      {anchor !== null && <NavigationRailTooltip label={label} shape={shape} anchor={anchor} />}
    </Box>
  );
}
