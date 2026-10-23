import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { NavigationRailItemProps } from '@/components/types/ui-navigation-list';

import NavigationRailTooltip from './navigation-rail-tooltip';
import NavigationRow from './navigation-row';
import railStyles from './rail-styles';
import useRailTooltip from './use-rail-tooltip';

export default function NavigationRailItem(props: NavigationRailItemProps): JSX.Element {
  const { layout, id, label } = props;
  const { visible, handlers } = useRailTooltip();
  const shape = layout === 'desktop' ? 'desktop' : (railStyles.tabletShapes[id] ?? 'tablet');

  return (
    <Box
      sx={railStyles.railItem[shape]}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      onFocus={handlers.onFocus}
      onBlur={handlers.onBlur}
      onKeyDown={handlers.onKeyDown}
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
      {visible && <NavigationRailTooltip label={label} shape={shape} />}
    </Box>
  );
}
