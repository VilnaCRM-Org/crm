import { customColors } from '@/styles/colors';

export default {
  target: {
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
    '@media (max-width:374px)': {
      '&:focus-visible': { outlineOffset: '-2px' },
      margin: '-10px -8px -10px -12px',
      padding: '10px 8px 10px 12px',
    },
  },
} as const;
