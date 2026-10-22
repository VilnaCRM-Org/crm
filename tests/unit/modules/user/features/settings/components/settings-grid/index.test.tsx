import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

import SettingsGrid from '@/modules/user/features/settings/components/settings-grid';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import loadIsolated from '@tests/unit/utils/isolated-module';

type GridStyles =
  (typeof import('@/modules/user/features/settings/components/settings-grid/styles'))['default'];

const loadStyles = (): Promise<GridStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/settings-grid/styles')).default
  );

const TABLET = 'min-width:768px';
const DESKTOP = 'min-width:1025px';
const DESKTOP_CARD = '42.1875rem';
const TWO_FACTOR_SLOT = 'minmax(0, 29.9375rem)';

const mountGrid = (count: number): HTMLElement => {
  render(
    <SettingsGrid>
      {Array.from({ length: count }, (_, index) => (
        <p key={index}>{`section ${index + 1}`}</p>
      ))}
    </SettingsGrid>
  );
  const sections = screen.getAllByText(/^section/);
  const grid = screen
    .getAllByRole('generic')
    .filter((element) => sections.every((section) => element.contains(section)))
    .at(-1);
  if (grid === undefined) throw new Error('grid not found');

  return grid;
};

describe('SettingsGrid', () => {
  it('renders its sections in the order given', () => {
    mountGrid(2);

    const sections = screen.getAllByText(/^section/);

    expect(sections.map((section) => section.textContent)).toEqual(['section 1', 'section 2']);
  });

  it('renders an empty grid without children', () => {
    render(<SettingsGrid />);
    const grid = screen.getAllByRole('generic').at(-1);

    expect(grid).toBeEmptyDOMElement();
    expect(styleRuleFor(grid as HTMLElement)?.getPropertyValue('display')).toBe('grid');
    expect(screen.queryByText(/^section/)).not.toBeInTheDocument();
  });

  it('stacks the sections in one column on a phone', () => {
    const grid = mountGrid(2);

    expect(styleRuleFor(grid)?.getPropertyValue('display')).toBe('grid');
    expect(styleRuleFor(grid)?.getPropertyValue('grid-template-columns')).toBe('minmax(0, 1fr)');
  });

  it('keeps one 749 px column on a tablet, up to and including the 1024 px frame', () => {
    const grid = mountGrid(2);

    expect(mediaStyleRuleFor(grid, TABLET)?.getPropertyValue('grid-template-columns')).toBe(
      'minmax(0, 46.8125rem)'
    );
    expect(mediaStyleRuleFor(grid, 'min-width:1024px')).toBeUndefined();
  });

  it('places a second section beside the card only above 1024 px, the profile card first', () => {
    const grid = mountGrid(2);
    const desktop = mediaStyleRuleFor(grid, DESKTOP);

    expect(desktop?.getPropertyValue('grid-template-columns')).toBe(`minmax(0, ${DESKTOP_CARD})`);
    expect(desktop?.getPropertyValue('grid-auto-flow')).toBe('column');
    expect(desktop?.getPropertyValue('grid-auto-columns')).toBe(TWO_FACTOR_SLOT);
    expect(within(grid).getAllByText(/^section/)[0]).toHaveTextContent('section 1');
  });

  it('keeps the profile card desktop width with one section and no empty column', () => {
    const grid = mountGrid(1);

    expect(mediaStyleRuleFor(grid, DESKTOP)?.getPropertyValue('grid-template-columns')).toBe(
      `minmax(0, ${DESKTOP_CARD})`
    );
  });

  it('pins every grid token', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      grid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '0.75rem',
        alignItems: 'start',
        '@media (min-width:768px)': { gridTemplateColumns: 'minmax(0, 46.8125rem)' },
        '@media (min-width:1025px)': {
          gridTemplateColumns: 'minmax(0, 42.1875rem)',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(0, 29.9375rem)',
        },
      },
    });
  });
});
