import loadIsolated from '@tests/unit/utils/isolated-module';

type ErrorPageVariantsModule = typeof import('@/components/error-page/error-page-variants');

const loadVariants = (): Promise<ErrorPageVariantsModule> =>
  loadIsolated(() => import('@/components/error-page/error-page-variants'));

describe('error page variant table', () => {
  it('pins every per-status difference', async () => {
    const { default: variants } = await loadVariants();

    expect(variants).toEqual({
      notFound: {
        glyphs: ['4', '0', '4'],
        digitColor: '#1EAEFF',
        digitShadowColor: '#0E87CC',
        titleKey: 'error_page.not_found.title',
        descriptionKey: 'error_page.not_found.description',
        codeKey: 'error_page.not_found.code',
        homeAppearance: 'contained',
        requestAccess: false,
      },
      forbidden: {
        glyphs: ['4', '0', '3'],
        digitColor: '#1B2327',
        digitShadowColor: '#999999',
        titleKey: 'error_page.forbidden.title',
        descriptionKey: 'error_page.forbidden.description',
        codeKey: 'error_page.forbidden.code',
        homeAppearance: 'outlined',
        requestAccess: true,
      },
      serverError: {
        glyphs: ['5', 'x', 'x'],
        digitColor: '#FFC01E',
        digitShadowColor: '#CC9300',
        titleKey: 'error_page.server_error.title',
        descriptionKey: 'error_page.server_error.description',
        codeKey: 'error_page.server_error.code',
        homeAppearance: 'contained',
        requestAccess: false,
      },
    });
  });

  it('pins the shared element ids', async () => {
    const { ERROR_PAGE_TITLE_ID, ERROR_PAGE_ACTIONS_ID, ERROR_PAGE_DIGITS_ID } =
      await loadVariants();

    expect(ERROR_PAGE_TITLE_ID).toBe('error-page-title');
    expect(ERROR_PAGE_ACTIONS_ID).toBe('error-page-actions');
    expect(ERROR_PAGE_DIGITS_ID).toBe('error-page-digits');
  });
});
