import { paletteColors } from '@/styles/colors';
import loadIsolated from '@tests/unit/utils/isolated-module';

const focusRing = (color: string): object => ({
  outline: 'none',
  '&:focus-visible': { outline: `2px solid ${color}`, outlineOffset: '2px' },
});

describe('registration notification heading focus styles', () => {
  it('rings the focused error heading in the error colour for keyboard focus', async () => {
    const styles = await loadIsolated(
      async () =>
        import('@auth/components/form-section/auth-forms/registration-notification.error-styles')
    );

    expect(styles.default.headingFocus).toEqual(focusRing(paletteColors.error.main));
  });

  it('rings the focused success heading in the primary colour for keyboard focus', async () => {
    const styles = await loadIsolated(
      async () =>
        import('@auth/components/form-section/auth-forms/registration-notification.success-styles')
    );

    expect(styles.default.headingFocus).toEqual(focusRing(paletteColors.primary.main));
  });
});
