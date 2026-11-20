import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Header from '@/modules/user/features/settings/components/two-factor-settings/card-header';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>{children}</I18nextProvider>;
}

describe('CardHeader', () => {
  it('names a level-2 heading, described by the subtitle, beside a decorative logo', () => {
    const { container } = render(<Header title="Заголовок" focus={false} divided />, {
      wrapper: Wrapper,
    });
    const logo = container.innerHTML;

    expect(
      screen.getByRole('heading', { level: 2, name: 'Заголовок' })
    ).toHaveAccessibleDescription('Випадковий код з обмеженням за часом, який створює застосунок.');
    expect(logo).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(logo).toMatch(/<svg[^>]*focusable="false"/);
  });

  it('takes focus on mount only when asked, and stays programmatically focusable', () => {
    const { unmount } = render(<Header title="Заголовок" focus={false} divided />, {
      wrapper: Wrapper,
    });
    const quiet = screen.getByRole('heading', { level: 2 });
    expect(quiet).not.toHaveFocus();
    expect(quiet).toHaveAttribute('tabindex', '-1');
    unmount();

    render(<Header title="Заголовок" focus divided />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
  });

  it.each([
    [true, 'center'],
    [false, 'flex-start'],
  ])('with divided %s aligns the row to %s', (divided, alignItems) => {
    render(<Header title="Заголовок" focus={false} divided={divided} />, { wrapper: Wrapper });

    const row = screen.getAllByRole('generic', { hidden: true })[1];

    expect(row).toHaveStyle({ alignItems, display: 'flex' });
  });
});
