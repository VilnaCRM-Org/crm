import { paletteColors } from '@/styles/colors';

export default {
  button: {
    padding: 0,
    border: 0,
    background: 'none',
    font: 'inherit',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    textAlign: 'left',
    color: paletteColors.primary.linkText,
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    cursor: 'pointer',
    '&:hover': { color: paletteColors.primary.linkTextHover },
    '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
    '&[aria-disabled="true"]:hover': { color: paletteColors.primary.linkText },
    '&:focus-visible': {
      outline: `2px solid ${paletteColors.primary.linkText}`,
      outlineOffset: '2px',
    },
  },
};
