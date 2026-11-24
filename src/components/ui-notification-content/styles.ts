import { touchRippleClasses } from '@mui/material/ButtonBase';

import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors } from '@/styles/colors';

const { sm } = breakpointsTheme.breakpoints.values;

const fromSm = `@media (min-width:${sm}px)`;

const forcedColors = '@media (forced-colors: active)';

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
  '@media (prefers-reduced-motion: reduce)': {
    [`& .${touchRippleClasses.root}`]: { display: 'none' },
  },
  [fromSm]: controlFromSm,
};

const systemControl = {
  [forcedColors]: { color: 'ButtonText', '&:focus-visible': { outlineColor: 'CanvasText' } },
};

const glyphFromSm = { fontSize: '1.5rem' };

export default {
  root: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'start',
    columnGap: '0.375rem',
    rowGap: '0.25rem',
    fontFamily: 'Golos',
    lineHeight: 'normal',
    color: customColors.text.dark,
    [fromSm]: { columnGap: '0.5rem' },
    [forcedColors]: { color: 'CanvasText' },
  },
  icon: {
    gridColumn: 1,
    gridRow: 1,
    display: 'inline-flex',
    fontSize: '1.25rem',
    [fromSm]: glyphFromSm,
  },
  message: {
    gridColumn: 2,
    gridRow: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    [fromSm]: { fontSize: '1rem', lineHeight: '1.5rem' },
  },
  time: {
    gridColumn: 2,
    color: customColors.text.muted,
    fontWeight: 400,
    fontSize: '0.8125rem',
    lineHeight: '1.25rem',
    [forcedColors]: { color: 'CanvasText' },
  },
  action: {
    ...control,
    margin: '-0.75rem 0',
    minWidth: 0,
    border: 0,
    background: 'none',
    cursor: 'pointer',
    font: 'inherit',
    textDecoration: 'underline',
    gridColumn: 2,
    justifySelf: 'start',
    [fromSm]: { margin: 0, minHeight: '1.5rem' },
    ...systemControl,
  },
  close: {
    ...control,
    gridColumn: 3,
    gridRow: 1,
    fontSize: '1.25rem',
    [fromSm]: { ...controlFromSm, ...glyphFromSm },
    ...systemControl,
  },
} as const;
