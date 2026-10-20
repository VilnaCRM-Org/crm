import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors } from '@/styles/colors';

const { md, lg, xl } = breakpointsTheme.breakpoints.values;

export default {
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.0625rem',
    paddingTop: '1.5rem',
    paddingBottom: '2rem',

    [`@media (min-width:${md}px)`]: {
      gap: '1rem',
    },
    [`@media (min-width:${lg + 1}px)`]: {
      gap: '0.75rem',
      paddingTop: '1.75rem',
      width: 'fit-content',
      maxWidth: '100%',
      marginInline: 'auto',
    },
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
    '&:focus-visible': { outline: `2px solid ${customColors.text.dark}`, outlineOffset: '2px' },

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
