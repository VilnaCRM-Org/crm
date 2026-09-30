import { render, screen } from '@testing-library/react';

import UIContainer from '@/components/ui-container';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import { elementAt } from '@tests/utils/assert-result';

const mountContainer = (): HTMLElement => {
  render(
    <UIContainer>
      <button type="button">Inside the container</button>
    </UIContainer>
  );

  const generics = screen.getAllByRole('generic');
  expect(generics).toHaveLength(2);
  return elementAt(generics, 1);
};

describe('UIContainer', () => {
  it('renders its children inside a single wrapper div', () => {
    const box = mountContainer();

    expect(box.tagName).toBe('DIV');
    expect(box).toContainElement(screen.getByRole('button', { name: 'Inside the container' }));
  });

  it('exposes no accessible name or role of its own, being a layout wrapper', () => {
    const box = mountContainer();

    expect(box).not.toHaveAttribute('aria-label');
    expect(box).not.toHaveAttribute('role');
    expect(screen.queryByLabelText(/container/i)).not.toBeInTheDocument();
  });

  it('centres its content and applies the mobile page gutters', () => {
    const box = mountContainer();

    expect(box).toHaveStyle({
      width: '100%',
      paddingLeft: '0.9375rem',
      paddingRight: '0.9375rem',
    });
    expect(styleRuleFor(box)?.getPropertyValue('margin')).toBe('0 auto');
  });

  it.each([
    ['min-width:768px', '1.625rem'],
    ['min-width:1024px', '2rem'],
    ['min-width:1440px', '7.75rem'],
  ])('widens the gutters at %s to %s', (mediaFragment, gutter) => {
    const box = mountContainer();
    const rule = mediaStyleRuleFor(box, mediaFragment);

    expect(rule?.getPropertyValue('padding-left')).toBe(gutter);
    expect(rule?.getPropertyValue('padding-right')).toBe(gutter);
  });
});
