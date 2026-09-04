import { render, screen } from '@testing-library/react';

import RegSuccessView from '@auth/components/form-section/auth-forms/registration-success-view';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

function renderSuccessView(isClosing = false): jest.Mock {
  const onBack = jest.fn();
  render(<RegSuccessView isClosing={isClosing} onBack={onBack} />);

  return onBack;
}

function focusTargets(): HTMLElement[] {
  return screen.getAllByRole('generic').filter((element) => element.hasAttribute('tabindex'));
}

describe('RegistrationSuccessView', () => {
  it('labels the celebratory confetti with its own translation key', () => {
    renderSuccessView();

    expect(
      screen.getByRole('img', { name: 'notifications.success.images.confetti' })
    ).toBeInTheDocument();
  });

  it('labels the decorative gears with their own translation key', () => {
    renderSuccessView();

    expect(
      screen.getByRole('img', { name: 'notifications.success.images.gears' })
    ).toBeInTheDocument();
  });

  it('renders a description that is distinct from the title', () => {
    renderSuccessView();

    expect(screen.getByText('notifications.success.description')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'notifications.success.title'
    );
  });

  it('exposes exactly one programmatic focus target that is out of the tab order', () => {
    renderSuccessView();

    const targets = focusTargets();

    expect(targets).toHaveLength(1);
    expect(targets[0]).toHaveAttribute('tabindex', '-1');
    expect(targets[0]).toHaveFocus();
  });

  it('disables the back button only while the notification is closing', () => {
    renderSuccessView(true);

    expect(screen.getByRole('button', { name: 'notifications.success.button' })).toBeDisabled();
  });
});
