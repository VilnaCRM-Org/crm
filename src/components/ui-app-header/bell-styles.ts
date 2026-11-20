import { customColors, paletteColors } from '@/styles/colors';

import { bareButton, roundButton, standaloneFocus } from './styles';

const enabledButton = {
  color: customColors.text.dark,
  cursor: 'pointer',
  ...standaloneFocus,
};

const enabledRound = {
  ...roundButton,
  ...enabledButton,
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
  alertBadge: {
    backgroundColor: paletteColors.error.text,
    '@media (forced-colors: active)': { border: '1px solid CanvasText' },
  },
} as const;
