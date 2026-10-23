import useMediaQuery from '@mui/material/useMediaQuery';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import breakpointsTheme from '@/components/ui-breakpoints';

const { lg, xl } = breakpointsTheme.breakpoints.values;

export default function useShellLayout(): ShellLayout {
  const fromDesktop = useMediaQuery(`(min-width:${xl}px)`, { noSsr: true });
  const fromTablet = useMediaQuery(`(min-width:${lg}px)`, { noSsr: true });

  if (fromDesktop) return 'desktop';

  return fromTablet ? 'tablet' : 'mobile';
}
