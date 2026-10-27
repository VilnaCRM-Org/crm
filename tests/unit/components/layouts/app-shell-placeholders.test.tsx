import { render, screen } from '@testing-library/react';

import AppShellPlaceholders from '@/components/layouts/app-shell-placeholders';
import { styleRuleFor, winningMediaValueFor } from '@tests/unit/utils/emotion-style-rules';

const placeholders = (): HTMLElement[] =>
  screen
    .queryAllByRole('generic', { hidden: true })
    .filter((element) => element.getAttribute('aria-hidden') === 'true');

const declared = (element: Element | undefined, properties: readonly string[]): string[] =>
  properties.map((property) =>
    element === undefined ? '' : (styleRuleFor(element)?.getPropertyValue(property) ?? '')
  );

describe('AppShellPlaceholders', () => {
  it('renders the header slot and the navigation column as two empty aria-hidden boxes', () => {
    render(<AppShellPlaceholders />);
    const boxes = placeholders();

    expect(boxes).toHaveLength(2);
    boxes.forEach((box) => expect(box).toBeEmptyDOMElement());
  });

  it('exposes nothing to assistive technology', () => {
    render(<AppShellPlaceholders />);
    const boxes = placeholders();

    expect(screen.queryAllByRole('generic').filter((element) => boxes.includes(element))).toEqual(
      []
    );
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.queryAllByRole('link')).toEqual([]);
  });

  it('holds the 64 px sticky header row and the 250 px navigation column', () => {
    render(<AppShellPlaceholders />);
    const [header, navigation] = placeholders();

    expect(
      declared(header, ['position', 'top', 'z-index', 'box-sizing', 'height', 'align-self'])
    ).toEqual(['sticky', '0', '1100', 'border-box', '64px', 'start']);
    expect(declared(navigation, ['display', 'width'])).toEqual(['none', '250px']);
  });

  it('shows the navigation column from 1024 px and widens it to 251 px below 1440 px', () => {
    render(<AppShellPlaceholders />);
    const [, navigation = document.body] = placeholders();

    expect(winningMediaValueFor(navigation, 'min-width:1024px', 'display')).toBe('block');
    expect(winningMediaValueFor(navigation, 'max-width:1439.95px', 'width')).toBe('251px');
  });
});
