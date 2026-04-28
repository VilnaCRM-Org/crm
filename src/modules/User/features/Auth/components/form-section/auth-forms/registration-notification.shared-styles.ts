import breakpointsTheme, { heightBreakpoints } from '@/components/UIBreakpoints';
import { paletteColors } from '@/styles/colors';
import type { Theme } from '@mui/material/styles';

const compactMaxWidth = breakpointsTheme.breakpoints.values.sm - 1;

export const compactViewport = [
  `@media (max-width:${compactMaxWidth}px)`,
  `(max-height:${heightBreakpoints.compact}px)`,
].join(' and ');

export const centeredColumnFlex = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  width: '100%',
} as const;

export const notificationSection = {
  position: 'absolute',
  inset: 0,
  backgroundColor: paletteColors.background.default,
  borderRadius: '16px',
  overflow: 'hidden',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
} as const;

export const messageButtonText = (
  theme: Theme
): Theme['typography']['button'] & Record<string, unknown> => ({
  fontFamily: 'Golos, sans-serif',
  fontSize: '0.9375rem',
  lineHeight: '1.125rem',
  fontWeight: 500,
  [theme.breakpoints.up('md')]: {
    fontSize: '1.125rem',
    lineHeight: '1.35rem',
    fontWeight: 600,
  },
});
