import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { NavigationRailTooltipProps } from '@/components/types/ui-navigation-list';

import railStyles from './rail-styles';
import useRailTooltipPosition from './use-rail-tooltip-position';

export default function NavigationRailTooltip({
  label,
  shape,
  anchor,
}: NavigationRailTooltipProps): JSX.Element {
  const position = useRailTooltipPosition(anchor, railStyles.tooltip[shape]);

  return (
    <Box aria-hidden="true" sx={{ ...railStyles.tooltipBase, ...position }}>
      <Box sx={railStyles.tooltipCaret} />
      <Box sx={railStyles.tooltipBody}>{label}</Box>
    </Box>
  );
}
