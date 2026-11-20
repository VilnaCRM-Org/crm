import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import KeyBlock from '@/modules/user/features/settings/components/two-factor-settings/key-block';
import { buildTotpSecret } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>{children}</I18nextProvider>;
}

const FAILED = 'Не вдалося скопіювати. Виділіть ключ і скопіюйте вручну.';
const CHECK_ICON = 'MuiSvgIcon-root';

describe('KeyBlock', () => {
  it('names an icon-only, non-submitting copy button beside the code', () => {
    render(<KeyBlock secret={buildTotpSecret()} copyLabel="Скопіювати ключ" />, {
      wrapper: Wrapper,
    });

    const button = screen.getByRole('button', { name: 'Скопіювати ключ' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.innerHTML).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(button.innerHTML).not.toContain(CHECK_ICON);
    expect(screen.getByRole('code')).toBeInTheDocument();
  });

  it('copies the raw secret, swaps the glyph and announces success', async () => {
    const secret = buildTotpSecret();
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<KeyBlock secret={secret} copyLabel="Скопіювати ключ" />, { wrapper: Wrapper });
    const button = screen.getByRole('button', { name: 'Скопіювати ключ' });
    const before = button.innerHTML;

    await user.click(button);

    expect(writeText).toHaveBeenCalledWith(secret);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Ключ скопійовано'));
    expect(button.innerHTML).not.toBe(before);
    expect(before).not.toContain(CHECK_ICON);
    expect(button.innerHTML).toContain(CHECK_ICON);
    expect(screen.queryByText(FAILED)).not.toBeInTheDocument();
  });

  it('shows the manual instruction and selects the key when copying fails', async () => {
    const secret = buildTotpSecret();
    const user = userEvent.setup();
    jest.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    render(<KeyBlock secret={secret} copyLabel="Скопіювати ключ" />, { wrapper: Wrapper });

    const button = screen.getByRole('button', { name: 'Скопіювати ключ' });
    await user.click(button);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(FAILED));
    expect(button.innerHTML).not.toContain(CHECK_ICON);
    expect(screen.getAllByText(FAILED).find((node) => node.tagName === 'P')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(window.getSelection()?.toString().replaceAll(' ', '')).toBe(secret);
  });
});
