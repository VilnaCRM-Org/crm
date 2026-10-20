import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { doubledClass, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>
    <main>{children}</main>
  </I18nextProvider>
);

interface LoadErrorProps {
  readonly onRetry: () => void;
  readonly focus: boolean;
}

interface LoadErrorModule {
  readonly default: (props: LoadErrorProps) => JSX.Element;
}

const { default: ProfileLoadError } = jest.requireActual<LoadErrorModule>(
  '@/modules/user/features/settings/components/user-profile-settings/profile-load-error'
);

const FAILED = 'Не вдалося завантажити профіль';
const RETRY = 'Спробувати ще раз';

const retryButton = (): HTMLElement => screen.getByRole('button', { name: RETRY });

describe('ProfileLoadError', () => {
  it('renders the message under its id and a retry button it describes, with no alert role', () => {
    render(<ProfileLoadError onRetry={jest.fn()} focus={false} />, { wrapper });

    expect(screen.getByText(FAILED)).toHaveAttribute('id', 'profile-load-error-message');
    expect(retryButton()).toHaveAttribute('aria-describedby', 'profile-load-error-message');
    expect(retryButton()).toHaveAccessibleDescription(FAILED);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('leaves focus alone unless asked to take it', () => {
    render(<ProfileLoadError onRetry={jest.fn()} focus={false} />, { wrapper });

    expect(document.body).toHaveFocus();
  });

  it('takes focus on mount when asked to', async () => {
    render(<ProfileLoadError onRetry={jest.fn()} focus />, { wrapper });

    expect(await screen.findByRole('button', { name: RETRY })).toHaveFocus();
  });

  it('asks for one new read per activation', async () => {
    const onRetry = jest.fn();
    render(<ProfileLoadError onRetry={onRetry} focus={false} />, { wrapper });

    await userEvent.click(retryButton());

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('draws the 2 px #1A1C1E focus ring with a 2 px offset', () => {
    render(<ProfileLoadError onRetry={jest.fn()} focus={false} />, { wrapper });

    const ring = styleRuleFor(retryButton(), doubledClass(retryButton(), ':focus-visible'));

    expect(ring?.getPropertyValue('outline')).toBe('2px solid #1A1C1E');
    expect(ring?.getPropertyValue('outline-offset')).toBe('2px');
  });

  it('has no axe violations', async () => {
    const view = render(<ProfileLoadError onRetry={jest.fn()} focus={false} />, { wrapper });

    await expectNoA11yViolations(view.container);
  });
});
