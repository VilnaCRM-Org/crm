import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const fromSm = `@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`;

const focusRing = {
  outline: `2px solid ${customColors.text.dark}`,
  outlineOffset: '2px',
};

const controlFromSm = { margin: 0, minWidth: '1.5rem', minHeight: '1.5rem' };

const control = {
  margin: '-0.75rem',
  minWidth: '2.75rem',
  minHeight: '2.75rem',
  padding: 0,
  color: customColors.text.dark,
  '&:hover, &:focus-visible': { backgroundColor: 'transparent' },
  '&:focus-visible': focusRing,
  [fromSm]: controlFromSm,
};

export default {
  stack: {
    position: 'fixed',
    left: '0.9375rem',
    right: '0.9375rem',
    bottom: '0.9375rem',
    zIndex: 1400,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    [fromSm]: { left: 'auto', right: '1.5rem', bottom: '1.5rem', width: '24.8125rem' },
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
    [fromSm]: { gap: '0.5rem', padding: '1.1875rem 1.125rem 1.1875rem 1.25rem', fontSize: '1rem' },
    '@media (forced-colors: active)': { border: '1px solid CanvasText' },
  },
  tones: {
    success: { backgroundColor: paletteColors.success.surface },
    error: { backgroundColor: paletteColors.error.surface },
  },
  icon: {
    flexShrink: 0,
    display: 'inline-flex',
    fontSize: '1.25rem',
    [fromSm]: { fontSize: '1.5rem' },
  },
  iconTones: {
    success: { color: paletteColors.success.text },
    error: { color: paletteColors.error.main },
  },
  message: { flex: 1, minWidth: 0, overflowWrap: 'anywhere' },
  action: {
    ...control,
    margin: '-0.75rem 0',
    minWidth: 0,
    border: 0,
    background: 'none',
    cursor: 'pointer',
    font: 'inherit',
    textDecoration: 'underline',
    [fromSm]: { margin: 0, minHeight: '1.5rem' },
  },
  close: {
    ...control,
    flexShrink: 0,
    fontSize: '1.25rem',
    [fromSm]: { ...controlFromSm, fontSize: '1.5rem' },
  },
} as const;
