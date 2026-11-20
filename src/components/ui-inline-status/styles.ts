import { keyframes } from '@emotion/react';

import { customColors, paletteColors } from '@/styles/colors';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const successEdge = paletteColors.success.text;

const errorEdge = paletteColors.error.main;

export default {
  block: {
    marginTop: '1rem',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    color: customColors.text.dark,
    animation: `${fadeIn} 160ms ease-out`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    '@media (forced-colors: active)': { border: '1px solid CanvasText', boxShadow: 'none' },
  },
  placements: {
    actions: {},
    email: { marginTop: '0.5rem' },
  },
  tones: {
    success: {
      backgroundColor: paletteColors.success.surface,
      boxShadow: `inset 4px 0 0 0 ${successEdge}`,
    },
    error: {
      backgroundColor: paletteColors.error.surface,
      boxShadow: `inset 4px 0 0 0 ${errorEdge}`,
    },
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
} as const;
