import { customColors, paletteColors } from '@/styles/colors';
import { focusVisibleRing } from '@/styles/focus-ring';

export default {
  notice: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem 1.5rem',
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
    fontFamily: 'Golos',
  },
  message: {
    flex: '1 1 16rem',
    margin: 0,
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: customColors.text.dark,
  },
  actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem 1rem' },
  link: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: '#0074B5',
    textDecoration: 'underline',
    ...focusVisibleRing,
  },
  dismiss: {
    '&&': {
      minWidth: 0,
      height: '2.5rem',
      padding: '0 1.25rem',
      borderRadius: '3.5625rem',
      border: `1px solid ${paletteColors.border.strong}`,
      backgroundColor: paletteColors.background.default,
      color: customColors.brand.darkPrimary,
      fontFamily: 'Golos',
      fontWeight: 500,
      fontSize: '0.9375rem',
      textTransform: 'none',
      '&:hover': { backgroundColor: paletteColors.background.paper },
      ...focusVisibleRing,
    },
  },
} as const;
