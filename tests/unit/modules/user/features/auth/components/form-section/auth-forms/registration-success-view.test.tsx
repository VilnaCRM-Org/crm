import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegSuccessView from '@auth/components/form-section/auth-forms/registration-success-view';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

const TITLE = 'Вітаємо!';
const DESCRIPTION = 'Ви успішно увійшли';
const BUTTON = 'Продовжити';

function renderSuccessView(isClosing = false): { onBack: jest.Mock; container: HTMLElement } {
  const onBack = jest.fn();
  const { container } = render(
    <RegSuccessView
      isClosing={isClosing}
      onBack={onBack}
      title={TITLE}
      description={DESCRIPTION}
      buttonLabel={BUTTON}
    />
  );

  return { onBack, container };
}

describe('RegistrationSuccessView', () => {
  it('hides the decorative confetti and gears from assistive technology', () => {
    renderSuccessView();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('focuses the heading itself, out of the tab order', () => {
    renderSuccessView();

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('announces the description in a status region filled after mount', async () => {
    renderSuccessView();

    expect(await screen.findByRole('status')).toHaveTextContent(DESCRIPTION);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('runs the action from its labelled button', async () => {
    const { onBack } = renderSuccessView();

    await userEvent.click(screen.getByRole('button', { name: BUTTON }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('disables the button only while the notification is closing', () => {
    renderSuccessView(true);

    expect(screen.getByRole('button', { name: BUTTON })).toBeDisabled();
  });
});
