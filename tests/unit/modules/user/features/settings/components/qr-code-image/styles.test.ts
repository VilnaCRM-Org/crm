import loadIsolated from '@tests/unit/utils/isolated-module';

type QrCodeImageStylesModule =
  typeof import('@/modules/user/features/settings/components/qr-code-image/styles');

const loadModule = (): Promise<QrCodeImageStylesModule> =>
  loadIsolated(
    async () => await import('@/modules/user/features/settings/components/qr-code-image/styles')
  );

describe('QR code image styles', () => {
  it('renders the image as a block filling its column up to 12.5rem with its ratio', async () => {
    const styles = await loadModule();

    expect(styles.default).toEqual({
      image: { display: 'block', width: '100%', maxWidth: '12.5rem', height: 'auto' },
    });
  });
});
