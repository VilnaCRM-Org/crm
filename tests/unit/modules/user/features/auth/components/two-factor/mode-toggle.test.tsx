import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import ModeToggle from '@auth/components/two-factor/mode-toggle';
import createTwoFactorLocaleI18n from '@tests/unit/utils/create-two-factor-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const tree = (
  mode: 'totp' | 'recovery',
  busy: boolean,
  onSwitch: () => void,
  locale: 'uk' | 'en' = 'uk'
): JSX.Element => (
  <I18nextProvider i18n={createTwoFactorLocaleI18n(locale)}>
    <main>
      <ModeToggle mode={mode} busy={busy} onSwitch={onSwitch} />
    </main>
  </I18nextProvider>
);

describe('ModeToggle', () => {
  it.each([
    ['totp', 'uk', 'Використати резервний код'],
    ['recovery', 'uk', 'Використати код із застосунку'],
    ['totp', 'en', 'Use a recovery code'],
    ['recovery', 'en', 'Use a code from the app'],
  ] as const)('reads the %s mode label in %s', (mode, locale, label) => {
    render(tree(mode, false, jest.fn(), locale));

    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('switches once per activation, by click and by keyboard', async () => {
    const onSwitch = jest.fn();
    render(tree('totp', false, onSwitch));
    const toggle = screen.getByRole('button', { name: 'Використати резервний код' });

    await userEvent.click(toggle);
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onSwitch).toHaveBeenCalledTimes(3);
  });

  it('does nothing while a request is in flight', async () => {
    const onSwitch = jest.fn();
    render(tree('totp', true, onSwitch));
    const toggle = screen.getByRole('button', { name: 'Використати резервний код' });

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it('is underlined in the link colour and darkens on hover', async () => {
    render(tree('totp', false, jest.fn()));
    const toggle = screen.getByRole('button', { name: 'Використати резервний код' });

    expect(toggle).toHaveStyle({ color: '#0074B5', textDecoration: 'underline' });
  });

  it.each(['totp', 'recovery'] as const)(
    'has no accessibility violation in %s mode',
    async (mode) => {
      const { container } = render(tree(mode, false, jest.fn()));

      await expectNoA11yViolations(container);
    }
  );
});
