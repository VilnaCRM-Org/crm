import { customColors } from '@/styles/colors';

export default {
  burger: {
    '&:focus-visible': {
      outline: `2px solid ${customColors.text.dark}`,
      outlineOffset: '2px',
    },
    '&:focus:not(:focus-visible)': { outline: 'none' },
    display: 'block',
    flexShrink: 0,
    boxSizing: 'border-box',
    width: '44px',
    height: '44px',
    margin: '-10px',
    padding: '10px',
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    color: customColors.text.muted,
    '@media (max-width:374px)': {
      width: '42px',
      margin: '-10px -8px -10px -10px',
      paddingRight: '8px',
    },
  },
  glyph: { display: 'block', width: '24px', height: '24px' },
} as const;
