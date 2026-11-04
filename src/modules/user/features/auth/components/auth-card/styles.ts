import breakpointsTheme from '@/components/ui-breakpoints';

const tabletOnly =
  `@media (min-width:${breakpointsTheme.breakpoints.values.md}px) and ` +
  `(max-width:${breakpointsTheme.breakpoints.values.xl - 0.05}px)`;

const desktop = `@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`;

const TITLE = '& form > h1';
const SUBTITLE = '& form > h1 + p';
const SUBMIT = '& form > button[type="submit"]';
const CELL = '&& .ui-pin-input__cell';
const TOGGLE = '&& [data-challenge-toggle]';

const LARGE_TITLE = {
  marginTop: '-0.1875rem',
  marginBottom: '0.75rem',
  fontSize: '1.875rem',
  lineHeight: '2.25rem',
};
const LARGE_SUBTITLE = { maxWidth: 'none', marginBottom: '1.5rem' };
const LARGE_CELL = { borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.375rem' };

export default {
  challengeCard: {
    marginTop: '0.75rem',
    paddingBottom: '1.8125rem',
    [TITLE]: {
      marginBottom: '0.375rem',
      fontSize: '1.375rem',
      lineHeight: '1.625rem',
      '@media (min-width:375px)': { whiteSpace: 'nowrap' },
    },
    [SUBTITLE]: { maxWidth: '16.25rem', marginBottom: '0.8125rem' },
    [SUBMIT]: { marginTop: '1.6875rem' },
    [CELL]: { borderRadius: '0.5rem', fontWeight: 600, fontSize: '1.125rem' },
    [tabletOnly]: {
      maxWidth: '39.75rem',
      marginTop: '-3.1875rem',
      padding: '1.9375rem 2.4375rem',
      [TITLE]: LARGE_TITLE,
      [SUBTITLE]: LARGE_SUBTITLE,
      [SUBMIT]: { marginTop: '1.5rem' },
      [CELL]: {
        '--pin-cell-width': 'calc((100cqw - 40px) / 6)',
        height: '8.125rem',
        ...LARGE_CELL,
      },
      [TOGGLE]: { marginTop: '1.5rem', fontSize: '1.125rem', lineHeight: '1.875rem' },
    },
    [desktop]: {
      marginTop: '1.8125rem',
      marginBottom: 'auto',
      paddingBottom: '1.4375rem',
      [TITLE]: LARGE_TITLE,
      [SUBTITLE]: LARGE_SUBTITLE,
      [SUBMIT]: { marginTop: '2rem' },
      [CELL]: { '--pin-cell-width': '64px', ...LARGE_CELL },
      [TOGGLE]: { marginTop: '1rem' },
    },
  },
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
