import breakpointsTheme from '@/components/ui-breakpoints';

const { md, lg } = breakpointsTheme.breakpoints.values;

export default {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '0.75rem',
    alignItems: 'start',

    [`@media (min-width:${md}px)`]: {
      gridTemplateColumns: 'minmax(0, 46.8125rem)',
    },
    [`@media (min-width:${lg + 1}px)`]: {
      gridTemplateColumns: 'minmax(0, 42.1875rem)',
      gridAutoFlow: 'column',
      gridAutoColumns: 'minmax(0, 29.9375rem)',
    },
  },
};
