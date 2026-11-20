import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type IconStyles =
  (typeof import('@/components/ui-notification-content/notification-icon-styles'))['default'];

const loadStyles = (): Promise<IconStyles> =>
  loadIsolated(
    async () =>
      (await import('@/components/ui-notification-content/notification-icon-styles')).default
  );

describe('notification icon styles', () => {
  it('colours the success and error glyphs from the palette tokens', async () => {
    const styles = await loadStyles();

    expect(styles.success.color).toBe('#2E7D32');
    expect(styles.error.color).toBe('#DC3939');
  });

  it('keeps every glyph at 3:1 on its own surface', async () => {
    const styles = await loadStyles();

    expect(contrast(styles.success.color, '#E8F4EF')).toBeGreaterThanOrEqual(3);
    expect(contrast(styles.error.color, '#FDECEC')).toBeGreaterThanOrEqual(3);
  });

  it('shows a system colour in forced-colors mode', async () => {
    const styles = await loadStyles();

    expect(styles.success['@media (forced-colors: active)']).toEqual({ color: 'CanvasText' });
    expect(styles.error['@media (forced-colors: active)']).toEqual({ color: 'CanvasText' });
  });

  it('sets no colour of its own on the close glyph', async () => {
    const styles = await loadStyles();

    expect(styles.close).toEqual({});
  });
});
