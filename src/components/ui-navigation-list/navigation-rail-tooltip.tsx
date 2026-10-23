import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { NavigationRailTooltipProps } from '@/components/types/ui-navigation-list';

import railStyles from './rail-styles';

export default function NavigationRailTooltip({
  label,
  shape,
}: NavigationRailTooltipProps): JSX.Element {
  return (
    <Box aria-hidden="true" sx={{ ...railStyles.tooltipBase, ...railStyles.tooltip[shape] }}>
      <Box sx={railStyles.tooltipCaret} />
      <Box sx={railStyles.tooltipBody}>{label}</Box>
    </Box>
  );
}
