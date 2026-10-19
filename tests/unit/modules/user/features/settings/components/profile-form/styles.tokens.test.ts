import type s from '@/modules/user/features/settings/components/profile-form/styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type FormStyles = typeof s;

const loadStyles = (): Promise<FormStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/profile-form/styles')).default
  );

describe('profile form styles', () => {
  it('draws the Clear pill outlined with a #969B9D border and #1A1C1E text', async () => {
    const { clearButton } = await loadStyles();

    expect(clearButton).toMatchObject({
      border: '1px solid #969B9D',
      color: '#1A1C1E',
      backgroundColor: '#FFFFFF',
      borderRadius: '3.5625rem',
    });
  });

  it('gives Clear the repository focus ring and a muted, hover-free busy look', async () => {
    const { clearButton } = await loadStyles();

    expect(clearButton).toMatchObject({
      '&:focus-visible': { outline: '2px solid #1A1C1E', outlineOffset: '2px' },
      '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
      '&[aria-disabled="true"]:hover': { backgroundColor: '#FFFFFF' },
    });
  });

  it('underlines the resend link so colour is not its only difference', async () => {
    const { resendLink } = await loadStyles();

    expect(resendLink).toMatchObject({
      textDecoration: 'underline',
      textUnderlineOffset: '0.15em',
    });
  });

  it('pins the pill sizes and the section divider', async () => {
    const { saveButton, clearButton, sectionTitle } = await loadStyles();

    expect(saveButton).toMatchObject({ width: '100%', height: '3.125rem' });
    expect(Reflect.get(saveButton, '@media (min-width:768px)')).toMatchObject({
      width: '16.875rem',
      height: '3.875rem',
    });
    expect(Reflect.get(clearButton, '@media (min-width:768px)')).toMatchObject({
      width: '11.25rem',
    });
    expect(sectionTitle.borderTop).toBe('1px solid #EAECEE');
  });

  it('switches the field row to label-left from lg', async () => {
    const { field } = await loadStyles();

    expect(Reflect.get(field, '@media (min-width:1024px)')).toMatchObject({
      flexDirection: 'row',
      '& label': { flex: '0 0 9.5rem', marginBottom: 0 },
    });
  });
});
