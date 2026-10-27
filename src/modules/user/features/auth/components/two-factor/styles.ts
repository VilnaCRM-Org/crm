import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors } from '@/styles/colors';

export default {
  note: {
    fontFamily: 'Golos',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1.375rem',
    letterSpacing: 0,
    color: customColors.text.muted,
    margin: '0 0 1rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.25rem',
    },
  },
} as const;
