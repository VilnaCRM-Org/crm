import colorTheme from '@/components/UIColorTheme';

const centeredFlex = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export default {
  section: {
    paddingTop: '1rem',
    paddingBottom: '1rem',

    backgroundColor: colorTheme.palette.background.default,
  },

  backButton: {
    padding: '0rem',
    ...centeredFlex,
  },

  icon: {
    color: '#969B9D',
  },

  backText: {
    marginLeft: '0.5rem',
    paddingTop: '0.1875rem',
    paddingBottom: '0.1875rem',

    fontFamily: 'Golos',
    fontWeight: '500',
    fontSize: '0.9375rem',
    lineHeight: '1.125rem',

    textTransform: 'none',
    color: '#969B9D',
  },
};
