import breakpointsTheme from '@/components/ui-breakpoints';

const { lg } = breakpointsTheme.breakpoints.values;

export default {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '0.75rem',
    alignItems: 'start',

    [`@media (min-width:${lg}px)`]: {
      gridTemplateColumns: 'minmax(0, 42.1875rem) minmax(0, 29.9375rem)',
    },
  },
};
