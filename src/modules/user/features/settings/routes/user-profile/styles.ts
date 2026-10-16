import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors } from '@/styles/colors';

const { lg, xl } = breakpointsTheme.breakpoints.values;

export default {
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '1.75rem',
    paddingBottom: '2rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  heading: {
    margin: 0,
    fontFamily: 'Golos, sans-serif',
    fontWeight: 700,
    fontSize: '1.375rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
    '&:focus:not(:focus-visible)': { outline: 'none' },

    [`@media (min-width:${lg}px)`]: {
      fontSize: '1.75rem',
    },
    [`@media (min-width:${xl}px)`]: {
      fontSize: '1.375rem',
    },
  },
  subtitle: {
    margin: 0,
    fontFamily: 'Golos, sans-serif',
    fontWeight: 400,
    fontSize: '0.9375rem',
    lineHeight: '1.5625rem',
    color: customColors.text.primary,
  },
};
