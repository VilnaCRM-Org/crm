import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import UserChipName from '@/modules/user/features/settings/components/user-menu/user-chip-name';
import stubResizeObserver, { removeResizeObserver } from '@tests/unit/utils/stub-resize-observer';

const NAME = 'Anna Koval';

const boxes = (): HTMLElement[] => screen.getAllByRole('generic', { hidden: true });

const copies = (): HTMLElement[] => boxes().filter((box) => box.hasAttribute('data-text'));

const sizer = (): HTMLElement | undefined =>
  boxes().find((box) => box.getAttribute('aria-hidden') === 'true');

const nameBox = (): HTMLElement | undefined => boxes()[1];

describe('UserChipName', () => {
  afterEach(removeResizeObserver);

  it.each([
    ['desktop', '49px', '13px', '14px', '121px', '546px', '223px', '648px'],
    ['tablet', '57px', '16px', '16px', '138px', '254px', '251px', '367px'],
  ] as const)(
    'places the %s name at %s,%s in %s, %s to %s wide, in a chip %s to %s wide',
    (layout, left, top, fontSize, min, max, chip, chipMax) => {
      render(<UserChipName layout={layout} name={NAME} />);

      expect(screen.getByText(NAME)).toHaveStyle({
        left,
        top,
        fontSize,
        minWidth: min,
        maxWidth: max,
        width: `calc(${min} + var(--user-chip-grow, 0px))`,
      });
      expect(nameBox()).toHaveStyle({
        width: `calc(${chip} + var(--user-chip-grow, 0px))`,
        maxWidth: chipMax,
      });
    }
  );

  it('draws no name and empty copies for an unknown identity', () => {
    render(<UserChipName layout="desktop" name={undefined} />);

    expect(screen.queryByText(/\S/u)).not.toBeInTheDocument();
    expect(copies()).toEqual([]);
  });

  it('measures the name in two hidden, text-free copies', () => {
    render(<UserChipName layout="desktop" name={NAME} />);

    expect(copies().map((copy) => copy.getAttribute('data-text'))).toEqual([NAME, NAME]);
    copies().forEach((copy) => {
      expect(copy).toBeEmptyDOMElement();
      expect(sizer()).toContainElement(copy);
    });
    expect(sizer()).toHaveStyle({ visibility: 'hidden', overflow: 'hidden' });
  });

  it('starts the chip at its Figma width, with no growth', () => {
    render(<UserChipName layout="desktop" name={NAME} />);

    expect(nameBox()).toContainElement(screen.getByText(NAME));
    expect(nameBox()).toHaveStyle({ '--user-chip-grow': '0px' });
  });

  it('grows the chip and the name box by the extra width text spacing gives the name', () => {
    const observer = stubResizeObserver();
    render(<UserChipName layout="tablet" name={NAME} />);
    const [spaced, rest] = copies();
    if (spaced === undefined || rest === undefined) throw new Error('the name copies are missing');
    spaced.getBoundingClientRect = (): DOMRect => ({ width: 93.4 }) as DOMRect;
    rest.getBoundingClientRect = (): DOMRect => ({ width: 72 }) as DOMRect;

    act(observer.fire);

    expect(observer.observed).toEqual([spaced, rest]);
    expect(nameBox()).toHaveStyle({ '--user-chip-grow': '22px' });
  });
});
