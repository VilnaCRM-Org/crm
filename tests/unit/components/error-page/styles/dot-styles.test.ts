import loadIsolated from '@tests/unit/utils/isolated-module';

type DotStylesModule = typeof import('@/components/error-page/styles/dot-styles');

const TABLET = '@media (max-width: 1024px)';
const MOBILE = '@media (max-width:767.95px)';

const loadDotStyles = (): Promise<DotStylesModule> =>
  loadIsolated(() => import('@/components/error-page/styles/dot-styles'));

describe('ErrorPageDotStyles', () => {
  it('builds exactly the dot, dot columns and dot rows tokens', async () => {
    const { default: dotStyles } = await loadDotStyles();

    expect(Object.keys(dotStyles.build())).toEqual(['dot', 'dotColumns', 'dotRows']);
  });

  it('centres the dot on its render bounds and hides it on mobile', async () => {
    const { default: dotStyles } = await loadDotStyles();

    expect(dotStyles.build().dot).toEqual({
      zIndex: 5,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#0B315E',
      display: 'block',
      left: '574.921px',
      top: '99.928px',
      width: '10.338px',
      height: '10.354px',
      [TABLET]: {
        display: 'block',
        left: '558.255px',
        top: '99.928px',
        width: '10.529px',
        height: '10.354px',
      },
      [MOBILE]: { display: 'none' },
    });
  });

  it('shows the dot columns beside the card on desktop and tablet only', async () => {
    const { default: dotStyles } = await loadDotStyles();

    expect(dotStyles.build().dotColumns).toEqual({
      zIndex: 5,
      color: '#E1E7EA',
      display: 'block',
      left: '-80px',
      top: '376px',
      width: '59.09px',
      height: '161.541px',
      [TABLET]: {
        display: 'block',
        left: '-79.211px',
        top: '376px',
        width: '60.181px',
        height: '161.541px',
      },
      [MOBILE]: { display: 'none' },
    });
  });

  it('hides the dot rows above mobile and centres them under the card on mobile', async () => {
    const { default: dotStyles } = await loadDotStyles();

    expect(dotStyles.build().dotRows).toEqual({
      zIndex: 5,
      color: '#E1E7EA',
      display: 'none',
      [TABLET]: { display: 'none' },
      [MOBILE]: {
        display: 'block',
        left: '50%',
        bottom: 0,
        transform: 'translateX(-50%)',
        width: '161.541px',
        height: '59.091px',
      },
    });
  });
});
