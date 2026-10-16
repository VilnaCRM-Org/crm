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

const LG = 'min-width:1024px';
const DESKTOP_CARD = '42.1875rem';

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
    const { container } = render(<SettingsGrid />);

    expect(container).not.toBeEmptyDOMElement();
    expect(screen.queryByText(/^section/)).not.toBeInTheDocument();
  });

  it('stacks the sections in one column below the lg breakpoint', () => {
    const grid = mountGrid(2);

    expect(styleRuleFor(grid)?.getPropertyValue('display')).toBe('grid');
    expect(styleRuleFor(grid)?.getPropertyValue('grid-template-columns')).toBe('minmax(0, 1fr)');
  });

  it('places two sections side by side from lg, the profile card first', () => {
    const grid = mountGrid(2);
    const columns = mediaStyleRuleFor(grid, LG)?.getPropertyValue('grid-template-columns');

    expect(columns?.split(') ')).toHaveLength(2);
    expect(columns).toContain(`minmax(0, ${DESKTOP_CARD})`);
    expect(columns?.startsWith(`minmax(0, ${DESKTOP_CARD})`)).toBe(true);
    expect(within(grid).getAllByText(/^section/)[0]).toHaveTextContent('section 1');
  });

  it('keeps the profile card desktop width with one section', () => {
    const grid = mountGrid(1);

    expect(mediaStyleRuleFor(grid, LG)?.getPropertyValue('grid-template-columns')).toContain(
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
        '@media (min-width:1024px)': {
          gridTemplateColumns: 'minmax(0, 42.1875rem) minmax(0, 29.9375rem)',
        },
      },
    });
  });
});
