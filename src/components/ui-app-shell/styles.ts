import layoutStyles from '@/components/layouts/app-layout.styles';

const NAV_INSET_TOP = '10px';
const STICKY_TOP = '74px';

export default {
  header: layoutStyles.headerSlot,
  nav: {
    desktop: {
      ...layoutStyles.navSlot,
      boxSizing: 'border-box',
      paddingTop: NAV_INSET_TOP,
      paddingLeft: '12px',
    },
    tablet: {
      ...layoutStyles.navSlot,
      boxSizing: 'border-box',
      paddingTop: NAV_INSET_TOP,
      paddingLeft: '13px',
    },
  },
  sticky: { position: 'sticky', top: STICKY_TOP },
} as const;
