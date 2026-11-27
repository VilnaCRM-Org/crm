import loadIsolated from '@tests/unit/utils/isolated-module';

type BellStyles = (typeof import('@/components/ui-app-header/bell-styles'))['default'];

const loadBell = (): Promise<BellStyles> =>
  loadIsolated(async () => (await import('@/components/ui-app-header/bell-styles')).default);

describe('bell slot frame styles', () => {
  it.each([
    ['desktop', '48px'],
    ['tablet', '52px'],
    ['mobile', '24px'],
  ] as const)('sizes the %s frame to the bell box %s', async (layout, size) => {
    const { slot } = await loadBell();

    expect(slot[layout]).toEqual({
      position: 'relative',
      flexShrink: 0,
      overflow: 'visible',
      width: size,
      height: size,
    });
  });
});
