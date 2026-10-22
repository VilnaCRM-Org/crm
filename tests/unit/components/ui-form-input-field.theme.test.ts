import loadIsolated from '@tests/unit/utils/isolated-module';

type InputFieldTheme = (typeof import('@/components/ui-form-input-field/theme'))['default'];

const loadTheme = (): Promise<InputFieldTheme> =>
  loadIsolated(async () => (await import('@/components/ui-form-input-field/theme')).default);

describe('ui-form-input-field theme', () => {
  it('keeps an invalid outline in the error colour, thickened while focused', async () => {
    const theme = await loadTheme();

    expect(theme.components?.MuiOutlinedInput?.styleOverrides?.root).toMatchObject({
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: '1px solid #969B9D',
      },
      '&.Mui-error .MuiOutlinedInput-notchedOutline': {
        borderColor: '#DC3939',
      },
      '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderWidth: '2px',
      },
    });
  });

  it('colours a field error message with the accessible error text token', async () => {
    const theme = await loadTheme();

    expect(theme.components?.MuiFormHelperText?.styleOverrides?.root).toMatchObject({
      '&.Mui-error': { color: '#C62828' },
    });
  });

  it('declares the error rules after the focus rule so an invalid field stays red', async () => {
    const theme = await loadTheme();
    const root = theme.components?.MuiOutlinedInput?.styleOverrides?.root ?? {};

    expect(Object.keys(root)).toEqual([
      'borderRadius',
      '&:hover .MuiOutlinedInput-notchedOutline',
      '&.Mui-focused .MuiOutlinedInput-notchedOutline',
      '&.Mui-error .MuiOutlinedInput-notchedOutline',
      '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline',
      '&.Mui-disabled',
      '&.Mui-disabled .MuiOutlinedInput-notchedOutline',
    ]);
  });
});
