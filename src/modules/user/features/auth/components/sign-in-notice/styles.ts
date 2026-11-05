import { customColors, paletteColors } from '@/styles/colors';

export default {
  notice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    margin: '0 0 1rem',
    fontFamily: 'Golos',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: '1.375rem',
    letterSpacing: 0,
  },
  tones: {
    success: { color: paletteColors.success.text },
    neutral: { color: customColors.text.primary },
  },
  icon: {
    flexShrink: 0,
    fontSize: '1.375rem',
  },
};
