import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import UserProfileSettings from '@/modules/user/features/settings/components/user-profile-settings';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => ({ update: jest.fn(), resend: jest.fn(), read: jest.fn() }),
}));

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>
    <main>{children}</main>
  </I18nextProvider>
);

type Props = ComponentProps<typeof UserProfileSettings>;

const props = (overrides: Partial<Props> = {}): Props => ({
  status: 'loading',
  user: null,
  version: 0,
  refocus: false,
  retry: jest.fn(),
  adoption: { adopt: jest.fn(), confirm: jest.fn() },
  toasts: { toasts: { items: [] }, announcement: '', show: jest.fn(), dismiss: jest.fn() },
  saveRef: { current: null },
  ...overrides,
});

const card = (overrides: Partial<Props> = {}): JSX.Element => {
  const state = props(overrides);
  return (
    <UserProfileSettings
      status={state.status}
      user={state.user}
      version={state.version}
      refocus={state.refocus}
      retry={state.retry}
      adoption={state.adoption}
      toasts={state.toasts}
      saveRef={state.saveRef}
    />
  );
};

const LOADING = 'Завантаження профілю…';
const FAILED = 'Не вдалося завантажити профіль';
const RETRY = 'Спробувати ще раз';

describe('UserProfileSettings', () => {
  it('shows a hidden skeleton and the loading status while the read is pending', () => {
    const { container } = render(card(), { wrapper });

    expect(screen.getByRole('status')).toHaveTextContent(LOADING);
    expect(container.innerHTML).toContain('aria-hidden="true"');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Вітаємо!')).not.toBeInTheDocument();
  });

  it('hides every skeleton block from the accessibility tree', () => {
    render(card(), { wrapper });

    expect(screen.queryAllByRole('generic', { hidden: false }).length).toBeGreaterThanOrEqual(0);
    expect(screen.getAllByRole('generic', { hidden: true }).length).toBeGreaterThan(0);
    expect(within(screen.getByRole('main')).queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the failure in an alert with a retry button and an empty status', () => {
    render(card({ status: 'failed' }), { wrapper });

    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(screen.getByRole('button', { name: RETRY })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('does not move focus on the first failure', () => {
    render(card({ status: 'failed', refocus: false }), { wrapper });

    expect(screen.getByRole('button', { name: RETRY })).not.toHaveFocus();
  });

  it('puts focus on the retry button when a retry failed again', async () => {
    render(card({ status: 'failed', refocus: true }), { wrapper });

    expect(await screen.findByRole('button', { name: RETRY })).toHaveFocus();
  });

  it('asks for one new read when the retry button is activated', async () => {
    const retry = jest.fn();
    render(card({ status: 'failed', retry }), { wrapper });

    await userEvent.click(screen.getByRole('button', { name: RETRY }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('keeps the same status element across loading, failed and loading again', () => {
    const view = render(card(), { wrapper });
    const region = screen.getByRole('status');

    view.rerender(card({ status: 'failed' }));
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toBeEmptyDOMElement();

    view.rerender(card({ status: 'loading', refocus: true }));
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent(LOADING);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('shows the card with the header of the entity when ready', () => {
    const user = buildUserEntity({ fullName: 'Олена Петренко' });
    render(card({ status: 'ready', user }), { wrapper });

    expect(screen.getByText('Олена Петренко')).toBeVisible();
    expect(screen.getByText('Вітаємо!')).toBeVisible();
    expect(screen.getAllByRole('status')[0]).toBeEmptyDOMElement();
    expect(screen.getByRole('heading', { level: 2, name: 'Особисті дані' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders nothing but the status region for a ready state without an entity', () => {
    render(card({ status: 'ready', user: null }), { wrapper });

    expect(screen.queryByText('Вітаємо!')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('speaks English when the language is English', async () => {
    const i18n = createSettingsLocaleI18n('uk', ['en']);
    await i18n.changeLanguage('en');
    render(<I18nextProvider i18n={i18n}>{card({ status: 'failed' })}</I18nextProvider>);

    expect(screen.getByRole('alert')).toHaveTextContent('Your profile could not be loaded');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
