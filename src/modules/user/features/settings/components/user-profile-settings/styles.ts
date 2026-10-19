import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const { md } = breakpointsTheme.breakpoints.values;

export default {
  card: {
    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
    padding: '1.5rem 1.125rem 1.125rem',
    [`@media (min-width:${md}px)`]: { padding: '1.125rem 2rem 2rem' },
  },
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none' },
    },
  },
  skeletonHeader: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
  skeletonLines: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  skeletonField: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1rem',
    fontFamily: 'Golos',
  },
  errorMessage: {
    margin: 0,
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
  },
  retryButton: {
    '&:focus-visible': { outline: `2px solid ${customColors.text.dark}`, outlineOffset: '2px' },
  },
} as const;
