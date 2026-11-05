import { SETTINGS_DESKTOP, SETTINGS_TABLET } from '../profile-form/styles';

export default {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '0.75rem',
    alignItems: 'start',

    [SETTINGS_TABLET]: {
      gridTemplateColumns: 'minmax(0, 46.8125rem)',
    },
    [SETTINGS_DESKTOP]: {
      gridTemplateColumns: 'minmax(0, 42.1875rem)',
      gridAutoFlow: 'column',
      gridAutoColumns: 'minmax(0, 29.9375rem)',
    },
  },
};
