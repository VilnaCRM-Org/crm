import { customColors, paletteColors } from '@/styles/colors';

export default {
  empty: {
    display: 'block',
    outline: 'none',
  },

  notice: {
    display: 'block',
    marginBottom: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${paletteColors.border.default}`,
    backgroundColor: paletteColors.background.subtle,
    outline: 'none',
    '&:focus-visible': {
      outline: `2px solid ${paletteColors.primary.linkText}`,
      outlineOffset: '2px',
    },
  },

  text: {
    display: 'block',
    fontFamily: 'Golos',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    color: customColors.social.icon,
  },
} as const;
