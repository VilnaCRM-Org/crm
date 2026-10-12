import { render, screen, within } from '@testing-library/react';

import ErrorPageIllustration from '@/components/error-page/components/error-page-illustration';
import { assertInstanceOf, elementAt } from '@tests/utils/assert-result';

jest.mock('@/assets/illustrations/error-page/curve.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/diamond.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-columns.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-rows.svg', () => ({ ReactComponent: 'svg' }));

interface RenderedLayer {
  layer: HTMLElement;
  tab: HTMLElement;
  dot: HTMLElement;
  art: HTMLElement[];
}

const renderLayer = (): RenderedLayer => {
  render(<ErrorPageIllustration />);
  const layer = screen
    .getAllByRole('generic', { hidden: true })
    .find((element) => element.getAttribute('aria-hidden') === 'true');
  assertInstanceOf(layer, HTMLElement);
  const blocks = within(layer).getAllByRole('generic', { hidden: true });
  expect(blocks).toHaveLength(2);
  return {
    layer,
    tab: elementAt(blocks, 0),
    dot: elementAt(blocks, 1),
    art: within(layer).getAllByRole('presentation', { hidden: true }),
  };
};

describe('ErrorPageIllustration', () => {
  it('hides the whole decoration layer from assistive technology', () => {
    const { layer } = renderLayer();

    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('generic')).toHaveLength(1);
    expect(screen.queryAllByRole('presentation')).toHaveLength(0);
    expect(layer).toHaveTextContent(/^$/);
  });

  it('renders the CSS tab and dot plus four svg art elements', () => {
    const { tab, dot, art } = renderLayer();

    expect(tab.tagName).toBe('DIV');
    expect(dot.tagName).toBe('DIV');
    expect(art.map((element) => element.tagName.toLowerCase())).toEqual([
      'svg',
      'svg',
      'svg',
      'svg',
    ]);
  });

  it('keeps every svg out of the tab order', () => {
    const { art } = renderLayer();

    art.forEach((svg) => expect(svg).toHaveAttribute('focusable', 'false'));
  });

  it('puts the tab first so it paints under the rest of the layer', () => {
    const { tab, art } = renderLayer();

    art.forEach((svg) =>
      expect(tab.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    );
  });

  it('stacks the tab under the curve and the diamond, dot and dot grids on top', () => {
    const { layer, tab, dot, art } = renderLayer();
    const [curve, diamond, dotColumns, dotRows] = art;

    expect(layer).toHaveStyle({ position: 'absolute', pointerEvents: 'none' });
    expect(tab).toHaveStyle({ position: 'absolute', zIndex: '1', backgroundColor: '#FFC01E' });
    expect(curve).toHaveStyle({ zIndex: '2', opacity: '0.3' });
    expect(diamond).toHaveStyle({ zIndex: '5', color: '#01A6FF' });
    expect(dot).toHaveStyle({ position: 'absolute', zIndex: '5', backgroundColor: '#0B315E' });
    expect(dotColumns).toHaveStyle({ zIndex: '5', display: 'block' });
    expect(dotRows).toHaveStyle({ zIndex: '5', display: 'none' });
  });
});
