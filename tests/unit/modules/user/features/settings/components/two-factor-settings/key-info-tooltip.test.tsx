import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Tip from '@/modules/user/features/settings/components/two-factor-settings/key-info-tooltip';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>{children}</I18nextProvider>;
}

const INFO =
  'Цей ключ дозволить вам відновити Authenticator у разі втрати телефона. ' +
  'Інакше скидання Google Authenticator займе щонайменше 7 днів.';

const button = (): HTMLElement => screen.getByRole('button', { name: 'Навіщо зберігати ключ' });

const tooltipText = (): HTMLElement => screen.getByText(INFO);

describe('KeyInfoTooltip', () => {
  it('is a non-submitting button described by the tooltip, mounted while hidden', async () => {
    const { container } = render(<Tip />, { wrapper: Wrapper });

    expect(button()).toHaveAttribute('type', 'button');
    expect(button()).toHaveAccessibleDescription(INFO);
    expect(tooltipText()).toHaveAttribute('role', 'tooltip');
    expect(tooltipText()).not.toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('marks the glyph as decorative', () => {
    render(<Tip />, { wrapper: Wrapper });

    expect(button().innerHTML).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('shows on keyboard focus and hides on Escape', async () => {
    const user = userEvent.setup();
    render(<Tip />, { wrapper: Wrapper });

    await user.tab();
    expect(button()).toHaveFocus();
    expect(tooltipText()).toBeVisible();

    await user.keyboard('{Escape}');
    expect(tooltipText()).not.toBeVisible();
    expect(button()).toHaveFocus();
  });

  it('shows on hover, stays while hovering the tooltip itself, and hides on leaving', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Tip />
        <span>Поза</span>
      </>,
      { wrapper: Wrapper }
    );

    await user.hover(button());
    expect(tooltipText()).toBeVisible();

    await user.hover(tooltipText());
    expect(tooltipText()).toBeVisible();

    await user.hover(screen.getByText('Поза'));
    expect(tooltipText()).not.toBeVisible();
  });
});
