import { fireEvent, render, screen } from '@testing-library/react';

import RegNotification from '@auth/components/form-section/auth-forms/registration-notification';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const BACK_LABEL = 'notifications.error.button';
const RETRY_LABEL = 'notifications.error.retry_button';
const SUCCESS_BACK_LABEL = 'notifications.success.button';

describe('RegistrationNotification onShown effect', () => {
  it('does not announce a shown success while the error view is displayed', () => {
    const onShown = jest.fn();

    render(
      <RegNotification view="error" isSubmitting={false} onBack={jest.fn()} onShown={onShown} />
    );

    expect(onShown).not.toHaveBeenCalled();
  });

  it('announces a shown success once the view switches from error to success', () => {
    const onShown = jest.fn();
    const onBack = jest.fn();
    const { rerender } = render(
      <RegNotification view="error" isSubmitting={false} onBack={onBack} onShown={onShown} />
    );

    expect(onShown).not.toHaveBeenCalled();

    rerender(
      <RegNotification view="success" isSubmitting={false} onBack={onBack} onShown={onShown} />
    );

    expect(onShown).toHaveBeenCalledTimes(1);
  });
});

describe('RegistrationNotification back handling', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('locks both error actions while the close animation runs', () => {
    jest.useFakeTimers();

    render(
      <RegNotification view="error" isSubmitting={false} onBack={jest.fn()} onRetry={jest.fn()} />
    );

    const backButton = screen.getByRole('button', { name: BACK_LABEL });
    const retryButton = screen.getByRole('button', { name: RETRY_LABEL });

    expect(backButton).toBeEnabled();
    expect(retryButton).toBeEnabled();

    fireEvent.click(backButton);

    expect(screen.getByRole('button', { name: BACK_LABEL })).toBeDisabled();
    expect(screen.getByRole('button', { name: RETRY_LABEL })).toBeDisabled();
  });

  it('calls the latest onBack after the callback prop is replaced', () => {
    const firstOnBack = jest.fn();
    const secondOnBack = jest.fn();

    const { rerender } = render(
      <RegNotification view="success" isSubmitting={false} onBack={firstOnBack} />
    );

    rerender(<RegNotification view="success" isSubmitting={false} onBack={secondOnBack} />);

    fireEvent.click(screen.getByRole('button', { name: SUCCESS_BACK_LABEL }));

    expect(secondOnBack).toHaveBeenCalledTimes(1);
    expect(firstOnBack).not.toHaveBeenCalled();
  });
});
