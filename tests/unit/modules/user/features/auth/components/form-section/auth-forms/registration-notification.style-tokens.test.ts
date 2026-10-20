import breakpointsTheme, { heightBreakpoints } from '@/components/ui-breakpoints';
import { paletteColors } from '@/styles/colors';
import loadIsolated from '@tests/unit/utils/isolated-module';

const { sm, md } = breakpointsTheme.breakpoints.values;
const COMPACT = `@media (max-width:${sm - 1}px) and (max-height:${heightBreakpoints.compact}px)`;
const MEDIUM_HEIGHT_DESKTOP =
  `@media (min-width:${md}px) and ` + `(max-height:${heightBreakpoints.medium}px)`;

const focusRing = (color: string): object => ({
  outline: 'none',
  '&:focus-visible': { outline: `2px solid ${color}`, outlineOffset: '2px' },
});

describe('registration notification style tokens', () => {
  it('builds the compact viewport query from the small width and compact height', async () => {
    const shared = await loadIsolated(
      async () =>
        import('@auth/components/form-section/auth-forms/registration-notification.shared-styles')
    );

    expect(shared.compactViewport).toBe(COMPACT);
  });

  it('tightens the error content top padding on short desktops and compact screens', async () => {
    const styles = await loadIsolated(
      async () =>
        import('@auth/components/form-section/auth-forms/registration-notification.error-styles')
    );

    expect(styles.default.contentBoxError).toEqual(
      expect.objectContaining({
        paddingTop: '1rem',
        [`@media (min-width:${md}px)`]: { paddingTop: '4.25rem' },
        [MEDIUM_HEIGHT_DESKTOP]: { paddingTop: '1rem' },
        [COMPACT]: { paddingTop: '0.25rem' },
      })
    );
  });

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
