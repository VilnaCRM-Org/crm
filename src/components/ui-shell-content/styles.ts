import breakpointsTheme from '@/components/ui-breakpoints';

const { md, lg } = breakpointsTheme.breakpoints.values;

export default {
  container: {
    boxSizing: 'border-box',
    width: '100%',
    paddingInline: '15px',

    [`@media (min-width:${md}px)`]: {
      paddingInline: '26px',
    },
    [`@media (min-width:${lg}px)`]: {
      paddingInline: '12px',
    },
  },
} as const;
