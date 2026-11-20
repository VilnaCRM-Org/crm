import { keyframes } from '@emotion/react';

import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const { sm, lg } = breakpointsTheme.breakpoints.values;

const fromSm = `@media (min-width:${sm}px)`;

const fromDesktop = `@media (min-width:${lg + 1}px)`;

const enterFromBottom = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: none; }
`;

const enterFromEnd = keyframes`
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: none; }
`;

const entrance = '180ms cubic-bezier(0.2, 0, 0, 1)';

const successEdge = paletteColors.success.text;

const errorEdge = paletteColors.error.main;

const stackFromSm = {
  left: 'auto',
  right: '1.5rem',
  bottom: '1.5rem',
  width: '24.8125rem',
  maxHeight: 'calc(50dvh - 1.5rem)',
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
    maxHeight: 'calc(50dvh - 0.9375rem)',
    overflowY: 'auto',
    [fromSm]: stackFromSm,
    [fromDesktop]: { right: '0.75rem' },
  },
  toast: {
    padding: '0.9375rem',
    border: '1px solid',
    borderRadius: '0.75rem',
    color: customColors.text.dark,
    animation: `${enterFromBottom} ${entrance}`,
    [fromSm]: {
      padding: '1.125rem 1.0625rem 1.125rem 1.1875rem',
      animation: `${enterFromEnd} ${entrance}`,
    },
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    '@media (forced-colors: active)': { borderColor: 'CanvasText', boxShadow: 'none' },
  },
  tones: {
    success: {
      backgroundColor: paletteColors.success.surface,
      borderColor: successEdge,
      boxShadow: `inset 4px 0 0 0 ${successEdge}, ${customColors.shell.popoverShadow}`,
    },
    error: {
      backgroundColor: paletteColors.error.surface,
      borderColor: errorEdge,
      boxShadow: `inset 4px 0 0 0 ${errorEdge}, ${customColors.shell.popoverShadow}`,
    },
  },
} as const;
