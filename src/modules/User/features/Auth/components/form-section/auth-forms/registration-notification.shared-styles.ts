import breakpointsTheme, { heightBreakpoints } from '@/components/UIBreakpoints';
import { paletteColors } from '@/styles/colors';

export const compactViewport = `@media (max-width:${breakpointsTheme.breakpoints.values.sm - 1}px) and (max-height:${heightBreakpoints.compact}px)`;

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

export const messageButtonText = {
  fontWeight: 500,
  fontSize: '0.9375rem',
  lineHeight: '1.125rem',
  fontFamily: 'Golos, sans-serif',
  [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: '1.35rem',
  },
} as const;
