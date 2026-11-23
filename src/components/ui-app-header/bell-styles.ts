import { customColors, paletteColors } from '@/styles/colors';

import { bareButton, roundButton, standaloneFocus } from './styles';

const slotBase = { position: 'relative', flexShrink: 0, overflow: 'visible' };

const enabledButton = {
  color: customColors.text.dark,
  cursor: 'pointer',
  ...standaloneFocus,
};

const enabledRound = {
  ...roundButton,
  ...enabledButton,
  zIndex: 1,
  backgroundColor: paletteColors.background.default,
  '&:hover': { backgroundColor: paletteColors.background.paper },
};

export default {
  enabled: {
    desktop: { ...enabledRound, width: '48px', height: '48px' },
    tablet: { ...enabledRound, width: '52px', height: '52px' },
    mobile: {
      ...bareButton,
      ...enabledButton,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '2.75rem',
      minHeight: '2.75rem',
      margin: '-0.625rem',
    },
  },
  slot: {
    desktop: { ...slotBase, width: '48px', height: '48px' },
    tablet: { ...slotBase, width: '52px', height: '52px' },
    mobile: { ...slotBase, width: '24px', height: '24px' },
  },
  alertBadge: {
    zIndex: 1,
    pointerEvents: 'none',
    backgroundColor: paletteColors.error.text,
    '@media (forced-colors: active)': { border: '1px solid CanvasText' },
  },
} as const;
