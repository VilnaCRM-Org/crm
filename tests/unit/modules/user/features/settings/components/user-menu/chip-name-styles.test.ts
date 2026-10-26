import type sheet from '@/modules/user/features/settings/components/user-menu/chip-name-styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = typeof sheet;

const loadStyles = (): Promise<Styles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/user-menu/chip-name-styles'))
        .default
  );

const nameBase = {
  position: 'absolute',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 500,
  lineHeight: '18px',
  color: '#1A1C1E',
};

describe('user chip name styles', () => {
  it('pins box', async () => {
    const styles = await loadStyles();

    expect(styles.box).toEqual({
      desktop: {
        display: 'block',
        width: 'calc(223px + var(--user-chip-grow, 0px))',
        maxWidth: '648px',
      },
      tablet: {
        display: 'block',
        width: 'calc(251px + var(--user-chip-grow, 0px))',
        maxWidth: '367px',
      },
    });
  });

  it('pins name', async () => {
    const styles = await loadStyles();

    expect(styles.name).toEqual({
      desktop: {
        ...nameBase,
        left: '49px',
        top: '13px',
        width: 'calc(121px + var(--user-chip-grow, 0px))',
        minWidth: '121px',
        maxWidth: '546px',
        fontSize: '14px',
      },
      tablet: {
        ...nameBase,
        left: '57px',
        top: '16px',
        width: 'calc(138px + var(--user-chip-grow, 0px))',
        minWidth: '138px',
        maxWidth: '254px',
        fontSize: '16px',
      },
    });
  });

  it('pins sizers', async () => {
    const styles = await loadStyles();
    const box = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      overflow: 'hidden',
      visibility: 'hidden',
      pointerEvents: 'none',
      fontWeight: 500,
    };

    expect(styles.sizers).toEqual({
      desktop: { ...box, fontSize: '14px', '--chip-name-base': '14px' },
      tablet: { ...box, fontSize: '16px', '--chip-name-base': '16px' },
    });
  });

  it('pins copy', async () => {
    const styles = await loadStyles();
    const copy = { display: 'block', width: 'max-content', whiteSpace: 'nowrap' };

    expect(styles.copy).toEqual({
      spaced: { ...copy, '&::before': { content: 'attr(data-text)' } },
      rest: {
        ...copy,
        '&::before': {
          content: 'attr(data-text)',
          letterSpacing: 'normal !important',
          wordSpacing: 'normal !important',
        },
      },
    });
  });
});
