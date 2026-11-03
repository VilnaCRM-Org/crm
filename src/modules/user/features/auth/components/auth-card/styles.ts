import breakpointsTheme from '@/components/ui-breakpoints';

const tabletOnly =
  `@media (min-width:${breakpointsTheme.breakpoints.values.md}px) and ` +
  `(max-width:${breakpointsTheme.breakpoints.values.xl - 0.05}px)`;

export default {
  recoveryCard: {
    [tabletOnly]: {
      maxWidth: '39.75rem',
      padding: '1.9375rem 2.4375rem',
      '& form > h1 + p': { marginBottom: '1.25rem' },
      '& label': {
        fontSize: '1rem',
        lineHeight: 1.125,
        marginBottom: '0.5625rem',
      },
      '& form > button[type="submit"]': { marginBottom: '0.0625rem' },
    },
  },
};
