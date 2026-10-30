import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UILinkButton from '@/components/ui-link-button';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const label = 'Надіслати повторно';

describe('UILinkButton', () => {
  it('renders a non-submitting button named by its text that runs onClick', async () => {
    const onClick = jest.fn();
    render(<UILinkButton onClick={onClick}>{label}</UILinkButton>);

    const button = screen.getByRole('button', { name: label });
    await userEvent.click(button);

    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stays focusable but ignores clicks while unavailable', async () => {
    const onClick = jest.fn();
    render(
      <UILinkButton onClick={onClick} unavailable>
        {label}
      </UILinkButton>
    );

    const button = screen.getByRole('button', { name: label });
    button.focus();
    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeEnabled();
    expect(button).toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is described by the element the caller names, and by nothing otherwise', () => {
    const { rerender } = render(
      <>
        <span id="why">Offline</span>
        <UILinkButton onClick={jest.fn()} describedBy="why">
          {label}
        </UILinkButton>
      </>
    );

    expect(screen.getByRole('button', { name: label })).toHaveAccessibleDescription('Offline');

    rerender(
      <>
        <span id="why">Offline</span>
        <UILinkButton onClick={jest.fn()}>{label}</UILinkButton>
      </>
    );

    expect(screen.getByRole('button', { name: label })).not.toHaveAttribute('aria-describedby');
  });

  it('draws the link look and lets the caller add layout through sx', () => {
    render(
      <UILinkButton onClick={jest.fn()} sx={{ minHeight: '1.5rem' }}>
        {label}
      </UILinkButton>
    );

    expect(screen.getByRole('button', { name: label })).toHaveStyle({
      color: '#0074B5',
      textDecoration: 'underline',
      minHeight: '1.5rem',
    });
  });

  it('draws the link look with no sx given', () => {
    render(<UILinkButton onClick={jest.fn()}>{label}</UILinkButton>);

    expect(screen.getByRole('button', { name: label })).toHaveStyle({ color: '#0074B5' });
  });

  it('has no axe violations idle or unavailable', async () => {
    const view = render(
      <>
        <UILinkButton onClick={jest.fn()}>{label}</UILinkButton>
        <UILinkButton onClick={jest.fn()} unavailable>
          Інша дія
        </UILinkButton>
      </>
    );

    await expectNoA11yViolations(view.container);
  });
});
