import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChevronIcon } from '@/assets/icons/shell/chevron-left.svg';
import type { NavigationGroupToggleProps } from '@/components/types/ui-navigation-list';

import groupStyles from './group-styles';

export default function NavigationGroupToggle({
  layout,
  expanded,
  controls,
  onToggle,
}: NavigationGroupToggleProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box
      component="button"
      type="button"
      aria-expanded={expanded}
      aria-controls={expanded ? controls : undefined}
      aria-label={t(
        expanded ? 'app_shell.settings_group.collapse' : 'app_shell.settings_group.expand'
      )}
      onClick={onToggle}
      sx={{
        ...groupStyles.toggleBase,
        ...groupStyles.toggle[layout],
        ...(layout === 'drawer' && !expanded ? groupStyles.toggleDrawerCollapsed : {}),
      }}
    >
      <Box
        component={ChevronIcon}
        aria-hidden="true"
        focusable="false"
        sx={expanded ? groupStyles.toggleGlyph.expanded : groupStyles.toggleGlyph.collapsed}
      />
    </Box>
  );
}
