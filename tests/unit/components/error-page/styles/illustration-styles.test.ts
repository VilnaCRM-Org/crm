import loadIsolated from '@tests/unit/utils/isolated-module';

type IllustrationStylesModule = typeof import('@/components/error-page/styles/illustration-styles');

const TABLET = '@media (max-width: 1024px)';
const MOBILE = '@media (max-width:767.95px)';

const loadIllustrationStyles = (): Promise<IllustrationStylesModule> =>
  loadIsolated(() => import('@/components/error-page/styles/illustration-styles'));

describe('ErrorPageIllustrationStyles', () => {
  it('builds exactly the layer, tab, curve and diamond tokens', async () => {
    const { default: illustrationStyles } = await loadIllustrationStyles();

    expect(Object.keys(illustrationStyles.build())).toEqual(['layer', 'tab', 'curve', 'diamond']);
  });

  it('lays the decoration layer over the composition without taking pointer input', async () => {
    const { default: illustrationStyles } = await loadIllustrationStyles();

    expect(illustrationStyles.build().layer).toEqual({
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      '& > *': { position: 'absolute' },
    });
  });

  it('places the yellow tab by its card insets at every breakpoint', async () => {
    const { default: illustrationStyles } = await loadIllustrationStyles();

    expect(illustrationStyles.build().tab).toEqual({
      zIndex: 1,
      backgroundColor: '#FFC01E',
      left: '37px',
      right: '37px',
      top: '301px',
      height: '225px',
      borderRadius: '32px 32px 0 0',
      [TABLET]: {
        left: '26px',
        right: '27px',
        top: '301px',
        height: '225px',
        borderRadius: '32px 32px 0 0',
      },
      [MOBILE]: {
        left: '19.216px',
        right: '19.958px',
        top: '222.478px',
        height: '166.304px',
        borderRadius: '23.652px 23.652px 0 0',
      },
    });
  });

  it('draws the dashed curve at opacity 0.3 in its box at every breakpoint', async () => {
    const { default: illustrationStyles } = await loadIllustrationStyles();

    expect(illustrationStyles.build().curve).toEqual({
      zIndex: 2,
      color: '#00A3FF',
      opacity: 0.3,
      left: '-56px',
      top: '36px',
      width: '643px',
      height: '357px',
      [TABLET]: { left: '-84.303px', top: '36px', width: '654.86px', height: '357px' },
      [MOBILE]: { left: '2.695px', top: '58.388px', width: '360px', height: '200px' },
    });
  });

  it('draws the diamond above the card in its box at every breakpoint', async () => {
    const { default: illustrationStyles } = await loadIllustrationStyles();

    expect(illustrationStyles.build().diamond).toEqual({
      zIndex: 5,
      color: '#01A6FF',
      left: '44px',
      top: '54px',
      width: '40px',
      height: '40px',
      [TABLET]: { left: '17.541px', top: '54px', width: '40.738px', height: '40px' },
      [MOBILE]: { left: '10.346px', top: '39.912px', width: '29.565px', height: '29.565px' },
    });
  });
});
