import type s from '@/modules/user/features/settings/components/profile-form/styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type FormStylesModule =
  typeof import('@/modules/user/features/settings/components/profile-form/styles');

type FormStyles = typeof s;

const TABLET = '@media (min-width:768px)';
const DESKTOP = '@media (min-width:1025px)';
const RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };
const BLEED =
  'calc(-1 * var(--settings-card-inset-start)) calc(-1 * var(--settings-card-inset-end))';
const DIVIDER = { marginInline: BLEED, borderTop: '1px solid #EAECEE' };
const PILL = {
  minWidth: 0,
  maxHeight: 'none',
  margin: 0,
  padding: '0 1.5rem',
  borderRadius: '3.5625rem',
  fontFamily: 'Golos',
  fontWeight: 500,
  fontSize: '0.9375rem',
  lineHeight: '1.125rem',
  letterSpacing: 0,
  textTransform: 'none',
  '&:focus-visible': RING,
};
const PILL_FROM_TABLET = { fontWeight: 600, fontSize: '1.125rem', lineHeight: 'normal' };
const OUTLINED_PILL = {
  ...PILL,
  border: '1px solid #969B9D',
  backgroundColor: '#FFFFFF',
  color: '#1A1C1E',
  '&:hover': { backgroundColor: '#F4F5F6' },
};

const loadModule = (): Promise<FormStylesModule> =>
  loadIsolated(
    async () => await import('@/modules/user/features/settings/components/profile-form/styles')
  );

const loadStyles = async (): Promise<FormStyles> => (await loadModule()).default;

describe('profile form styles', () => {
  it('starts the tablet layout at 768 px and the desktop one above the 1024 px frame', async () => {
    const { SETTINGS_TABLET, SETTINGS_DESKTOP } = await loadModule();

    expect(SETTINGS_TABLET).toBe(TABLET);
    expect(SETTINGS_DESKTOP).toBe(DESKTOP);
  });

  it('exports the pill, ring and divider literals the sibling style files reuse', async () => {
    const shared = await loadModule();

    expect(shared.SETTINGS_FOCUS_RING).toEqual(RING);
    expect(shared.SETTINGS_DIVIDER).toEqual(DIVIDER);
    expect(shared.SETTINGS_PILL).toEqual(PILL);
    expect(shared.SETTINGS_PILL_FROM_TABLET).toEqual(PILL_FROM_TABLET);
    expect(shared.SETTINGS_OUTLINED_PILL).toEqual(OUTLINED_PILL);
  });

  it('draws the Clear pill outlined with a #969B9D border and #1A1C1E text', async () => {
    const { clearButton } = await loadStyles();

    expect(clearButton['&&']).toEqual({
      ...OUTLINED_PILL,
      display: 'inline-flex',
      width: '100%',
      height: '3.125rem',
      marginTop: '0.25rem',
      '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
      '&[aria-disabled="true"]:hover': { backgroundColor: '#FFFFFF' },
      [TABLET]: {
        ...PILL_FROM_TABLET,
        width: 'calc(50% - 0.28125rem)',
        height: '4.375rem',
        marginTop: 0,
      },
      [DESKTOP]: { width: '11.25rem', height: '3.875rem' },
    });
  });

  it('draws the Save pill filled, full width on a phone and 339 x 70 beside Clear', async () => {
    const { saveButton } = await loadStyles();

    expect(saveButton['&&']).toEqual({
      ...PILL,
      display: 'inline-flex',
      width: '100%',
      height: '3.125rem',
      [TABLET]: {
        ...PILL_FROM_TABLET,
        width: 'calc(50% - 0.21875rem)',
        height: '4.375rem',
        marginRight: '0.5rem',
      },
      [DESKTOP]: { width: '16.875rem', height: '3.875rem' },
    });
  });

  it('gives Save and Clear one #1A1C1E ring and Clear a muted, hover-free busy look', async () => {
    const { clearButton, saveButton } = await loadStyles();

    expect(saveButton['&&']['&:focus-visible']).toEqual(RING);
    expect(clearButton['&&']['&:focus-visible']).toEqual(RING);
    expect(clearButton['&&']['&[aria-disabled="true"]']).toEqual({
      cursor: 'default',
      opacity: 0.6,
    });
    expect(clearButton['&&']['&[aria-disabled="true"]:hover']).toEqual({
      backgroundColor: '#FFFFFF',
    });
  });

  it('underlines the resend link, darkens it on hover, keeps it one phrase', async () => {
    const { resendLink, emailStatus } = await loadStyles();

    expect(resendLink).toEqual({
      minHeight: '1.5rem',
      margin: '-0.1875rem 0',
      padding: 0,
      border: 0,
      background: 'none',
      font: 'inherit',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      textAlign: 'left',
      color: '#0074B5',
      textDecoration: 'underline',
      textUnderlineOffset: '0.15em',
      cursor: 'pointer',
      '&:hover': { color: '#00588A' },
      '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
      '&[aria-disabled="true"]:hover': { color: '#0074B5' },
      '&:focus-visible': { outline: '2px solid #0074B5', outlineOffset: '2px' },
      [TABLET]: { marginBlock: '-0.0625rem' },
      [DESKTOP]: { marginBlock: '-0.1875rem' },
    });
    expect(emailStatus).toEqual({
      margin: 0,
      fontWeight: 400,
      lineHeight: '1rem',
      whiteSpace: 'nowrap',
      color: '#57595B',
      [TABLET]: { lineHeight: '1.125rem' },
    });
  });

  it('places the unconfirmed row under the input and lets it wrap by phrase', async () => {
    const { emailRow } = await loadStyles();

    expect(emailRow).toEqual({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      columnGap: '0.5rem',
      rowGap: '0.25rem',
      margin: '-0.5rem 0 -0.0625rem',
      fontFamily: 'Inter',
      fontSize: '0.875rem',
      lineHeight: '1.125rem',
      [TABLET]: {
        margin: '-0.1875rem 0 -0.4375rem 10.8125rem',
        fontSize: '1.125rem',
        lineHeight: '1.375rem',
      },
      [DESKTOP]: {
        margin: '-0.1875rem 0 0 9.5rem',
        fontSize: '1rem',
        lineHeight: '1.125rem',
      },
    });
  });

  it('bleeds every divider through the card padding with the Figma rhythm per frame', async () => {
    const { sectionTitle, actionsDivider } = await loadStyles();

    expect(sectionTitle).toEqual({
      ...DIVIDER,
      marginTop: '1rem',
      marginBottom: '1rem',
      padding: '1rem var(--settings-card-inset-end) 0 var(--settings-card-inset-start)',
      fontFamily: 'Golos',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 'normal',
      color: '#1A1C1E',
      outline: 'none',
      [TABLET]: {
        marginTop: '1.5rem',
        marginBottom: '0.8125rem',
        paddingTop: '1.5rem',
        fontWeight: 700,
        fontSize: '1.375rem',
        lineHeight: '1.625rem',
      },
      [DESKTOP]: { marginBottom: '1rem' },
    });
    expect(actionsDivider).toEqual({
      ...DIVIDER,
      marginTop: '1rem',
      marginBottom: '1rem',
      [TABLET]: { marginTop: '1.5rem' },
      [DESKTOP]: { marginBottom: '1.5rem' },
    });
  });

  it('puts the label beside a 70 px input from the tablet frame, 64 px on desktop', async () => {
    const { field } = await loadStyles();

    expect(field).toEqual({
      marginBottom: '1rem',
      flexWrap: 'nowrap',
      '& label': { lineHeight: '1.125rem' },
      '& .MuiTextField-root': { minWidth: 0 },
      '& .MuiOutlinedInput-input': { color: '#1A1C1E' },
      [TABLET]: {
        marginBottom: '0.8125rem',
        flexDirection: 'row',
        alignItems: 'flex-start',
        '& label': {
          flex: '0 0 10.8125rem',
          display: 'flex',
          alignItems: 'center',
          minHeight: '4.375rem',
          margin: 0,
          fontSize: '1.125rem',
          lineHeight: '1.375rem',
        },
        '& .MuiTextField-root': { flex: '1 1 0' },
        '& .MuiOutlinedInput-input': {
          height: '4.375rem',
          maxHeight: 'none',
          paddingTop: '1.625rem',
          paddingBottom: '1.625rem',
          fontSize: '1.125rem',
        },
      },
      [DESKTOP]: {
        marginBottom: '0.75rem',
        '& label': {
          flexBasis: '9.5rem',
          minHeight: '4rem',
          fontSize: '1rem',
          lineHeight: '1.125rem',
        },
        '& .MuiOutlinedInput-input': {
          height: '4rem',
          paddingTop: '1.4375rem',
          paddingBottom: '1.4375rem',
          fontSize: '1rem',
        },
        '& .MuiOutlinedInput-input::placeholder': { fontSize: '1rem', lineHeight: '1.125rem' },
      },
    });
  });

  it('sets the status on a 25 px line, empty at no cost', async () => {
    const { status } = await loadStyles();

    expect(status).toEqual({
      margin: 0,
      fontFamily: 'Golos',
      fontSize: '0.9375rem',
      lineHeight: '1.5625rem',
      color: '#404142',
      '&:not(:empty)': { marginBottom: '1rem' },
    });
  });
});
