import loadIsolated from '@tests/unit/utils/isolated-module';

describe('recovery-codes copy styles', () => {
  it('holds the copied text for 3 s', async () => {
    const { default: timing } = await loadIsolated(
      () =>
        import('@/modules/user/features/settings/components/two-factor-settings/copy-line-timing')
    );

    expect(timing).toEqual({ holdMs: 3000 });
  });

  it('pins the 16 px failure slot and the one cell both texts share', async () => {
    const { default: styles } = await loadIsolated(
      () =>
        import('@/modules/user/features/settings/components/two-factor-settings/copy-line-styles')
    );

    expect(styles).toEqual({
      slot: { minHeight: '1rem' },
      failedLine: {
        margin: 0,
        fontFamily: 'Inter',
        fontWeight: 400,
        fontSize: '0.875rem',
        lineHeight: '1rem',
        color: '#404142',
        overflowWrap: 'anywhere',
      },
      label: { display: 'inline-grid' },
      text: {
        shown: { gridArea: '1/1', visibility: 'visible' },
        hidden: { gridArea: '1/1', visibility: 'hidden' },
      },
    });
  });
});
