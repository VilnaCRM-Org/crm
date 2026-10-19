import type s from '@/modules/user/features/settings/components/profile-form/styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type FormStylesModule =
  typeof import('@/modules/user/features/settings/components/profile-form/styles');

type FormStyles = typeof s;

const TABLET = '@media (min-width:768px)';
const DESKTOP = '@media (min-width:1025px)';
const RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };

const loadModule = (): Promise<FormStylesModule> =>
  loadIsolated(
    async () => await import('@/modules/user/features/settings/components/profile-form/styles')
  );

const loadStyles = async (): Promise<FormStyles> => (await loadModule()).default;

const at = (style: object, media: string): object => Reflect.get(style, media) as object;

describe('profile form styles', () => {
  it('starts the tablet layout at 768 px and the desktop one above the 1024 px frame', async () => {
    const { SETTINGS_TABLET, SETTINGS_DESKTOP } = await loadModule();

    expect(SETTINGS_TABLET).toBe(TABLET);
    expect(SETTINGS_DESKTOP).toBe(DESKTOP);
  });

  it('draws the Clear pill outlined with a #969B9D border and #1A1C1E text', async () => {
    const { clearButton } = await loadStyles();

    expect(clearButton['&&']).toMatchObject({
      border: '1px solid #969B9D',
      color: '#1A1C1E',
      backgroundColor: '#FFFFFF',
      borderRadius: '3.5625rem',
      letterSpacing: 0,
      textTransform: 'none',
    });
  });

  it('gives Save and Clear one #1A1C1E ring and Clear a muted, hover-free busy look', async () => {
    const { clearButton, saveButton } = await loadStyles();

    expect(saveButton['&&']['&:focus-visible']).toEqual(RING);
    expect(clearButton['&&']).toMatchObject({
      '&:focus-visible': RING,
      '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
      '&[aria-disabled="true"]:hover': { backgroundColor: '#FFFFFF' },
    });
  });

  it('underlines the resend link, darkens it on hover, keeps it one phrase', async () => {
    const { resendLink, emailStatus } = await loadStyles();

    expect(resendLink).toMatchObject({
      textDecoration: 'underline',
      textUnderlineOffset: '0.15em',
      whiteSpace: 'nowrap',
      textAlign: 'left',
      '&:hover': { color: '#00588A' },
      '&[aria-disabled="true"]:hover': { color: '#0074B5' },
    });
    expect(emailStatus).toMatchObject({ whiteSpace: 'nowrap', lineHeight: '1rem' });
  });

  it('keeps the 24 px resend target out of the row height at every frame', async () => {
    const { resendLink } = await loadStyles();

    expect(resendLink).toMatchObject({ minHeight: '1.5rem', margin: '-0.1875rem 0' });
    expect(at(resendLink, TABLET)).toEqual({ marginBlock: '-0.0625rem' });
    expect(at(resendLink, DESKTOP)).toEqual({ marginBlock: '-0.1875rem' });
  });

  it('places the unconfirmed row under the input and lets it wrap by phrase', async () => {
    const { emailRow } = await loadStyles();

    expect(emailRow).toMatchObject({
      flexWrap: 'wrap',
      columnGap: '0.5rem',
      rowGap: '0.25rem',
      margin: '-0.5rem 0 -0.0625rem',
      fontSize: '0.875rem',
    });
    expect(at(emailRow, TABLET)).toEqual({
      margin: '-0.1875rem 0 -0.4375rem 10.8125rem',
      fontSize: '1.125rem',
      lineHeight: '1.375rem',
    });
    expect(at(emailRow, DESKTOP)).toEqual({
      margin: '-0.1875rem 0 0 9.5rem',
      fontSize: '1rem',
      lineHeight: '1.125rem',
    });
  });

  it('sizes the pills: 50 px full width, 339 + 338 x 70 in a row, 270 and 180 x 62', async () => {
    const { saveButton, clearButton } = await loadStyles();

    expect(saveButton['&&']).toMatchObject({
      width: '100%',
      height: '3.125rem',
      margin: 0,
      minWidth: 0,
      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: '1.125rem',
    });
    expect(clearButton['&&']).toMatchObject({
      width: '100%',
      height: '3.125rem',
      marginTop: '0.25rem',
    });
    expect(at(saveButton['&&'], TABLET)).toEqual({
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 'normal',
      width: 'calc(50% - 0.21875rem)',
      height: '4.375rem',
      marginRight: '0.5rem',
    });
    expect(at(clearButton['&&'], TABLET)).toEqual({
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 'normal',
      width: 'calc(50% - 0.28125rem)',
      height: '4.375rem',
      marginTop: 0,
    });
    expect(at(saveButton['&&'], DESKTOP)).toEqual({ width: '16.875rem', height: '3.875rem' });
    expect(at(clearButton['&&'], DESKTOP)).toEqual({ width: '11.25rem', height: '3.875rem' });
  });

  it('bleeds every divider through the card padding', async () => {
    const { sectionTitle, actionsDivider } = await loadStyles();
    const bleed =
      'calc(-1 * var(--settings-card-inset-start)) calc(-1 * var(--settings-card-inset-end))';

    expect(sectionTitle).toMatchObject({ borderTop: '1px solid #EAECEE', marginInline: bleed });
    expect(sectionTitle.padding).toBe(
      '1rem var(--settings-card-inset-end) 0 var(--settings-card-inset-start)'
    );
    expect(actionsDivider).toMatchObject({ borderTop: '1px solid #EAECEE', marginInline: bleed });
  });

  it('keeps the Figma rhythm around each divider at each frame', async () => {
    const { sectionTitle, actionsDivider } = await loadStyles();

    expect(sectionTitle).toMatchObject({
      marginTop: '1rem',
      marginBottom: '1rem',
      fontWeight: 600,
      fontSize: '1.125rem',
    });
    expect(at(sectionTitle, TABLET)).toEqual({
      marginTop: '1.5rem',
      marginBottom: '0.8125rem',
      paddingTop: '1.5rem',
      fontWeight: 700,
      fontSize: '1.375rem',
      lineHeight: '1.625rem',
    });
    expect(at(sectionTitle, DESKTOP)).toEqual({ marginBottom: '1rem' });
    expect(actionsDivider).toMatchObject({ marginTop: '1rem', marginBottom: '1rem' });
    expect(at(actionsDivider, TABLET)).toEqual({ marginTop: '1.5rem' });
    expect(at(actionsDivider, DESKTOP)).toEqual({ marginBottom: '1.5rem' });
  });

  it('lets the inputs fill their column and draws the value in #1A1C1E', async () => {
    const { field } = await loadStyles();

    expect(field).toMatchObject({
      marginBottom: '1rem',
      flexWrap: 'nowrap',
      '& label': { lineHeight: '1.125rem' },
      '& .MuiTextField-root': { minWidth: 0 },
      '& .MuiOutlinedInput-input': { color: '#1A1C1E' },
    });
  });

  it('puts the label beside a 70 px input on the tablet frame, centred on the input', async () => {
    const { field } = await loadStyles();

    expect(at(field, TABLET)).toMatchObject({
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
      '& .MuiOutlinedInput-input': { height: '4.375rem', fontSize: '1.125rem' },
    });
  });

  it('narrows the label column to 152 px beside a 64 px input on desktop', async () => {
    const { field } = await loadStyles();

    expect(at(field, DESKTOP)).toMatchObject({
      marginBottom: '0.75rem',
      '& label': { flexBasis: '9.5rem', minHeight: '4rem', fontSize: '1rem' },
      '& .MuiOutlinedInput-input': { height: '4rem', fontSize: '1rem' },
    });
  });

  it('sets the status on a 25 px line so the pills stay on whole pixels', async () => {
    const { status } = await loadStyles();

    expect(status).toMatchObject({
      margin: 0,
      lineHeight: '1.5625rem',
      '&:not(:empty)': { marginBottom: '1rem' },
    });
  });
});
