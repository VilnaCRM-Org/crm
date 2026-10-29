import layoutStyles from '@/components/layouts/app-layout.styles';

const STICKY_TOP = `calc(${layoutStyles.headerHeight} + ${layoutStyles.navInsetTop})`;

export default {
  header: layoutStyles.headerSlot,
  nav: {
    desktop: {
      ...layoutStyles.navSlot,
      boxSizing: 'border-box',
      paddingTop: layoutStyles.navInsetTop,
      paddingLeft: '12px',
    },
    tablet: {
      ...layoutStyles.navSlot,
      boxSizing: 'border-box',
      paddingTop: layoutStyles.navInsetTop,
      paddingLeft: '13px',
    },
  },
  sticky: { position: 'sticky', top: STICKY_TOP },
} as const;
