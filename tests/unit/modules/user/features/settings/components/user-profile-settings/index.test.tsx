import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, JSX, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';

import UserProfileSettings from '@/modules/user/features/settings/components/user-profile-settings';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { doubledClass, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

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
  adoption: { adopt: jest.fn(), confirm: jest.fn(), isCurrent: (): boolean => true },
  toasts: {
    toasts: { items: [] },
    announcement: '',
    alert: '',
    show: jest.fn(),
    dismiss: jest.fn(),
  },
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

const skeletonRoot = (): HTMLElement => {
  const root = screen
    .getAllByRole('generic', { hidden: true })
    .find((node) => node.getAttribute('aria-hidden') === 'true' && node.id === '');
  if (root === undefined) throw new Error('skeleton root not found');
  return root;
};

const LOADING = 'Завантаження профілю…';
const FAILED = 'Не вдалося завантажити профіль';
const RETRY = 'Спробувати ще раз';

describe('UserProfileSettings', () => {
  it('shows a hidden skeleton and the loading status while the read is pending', () => {
    render(card(), { wrapper });

    expect(screen.getByRole('status')).toHaveTextContent(LOADING);
    expect(screen.getAllByRole('generic', { hidden: true }).map((node) => node.id)).toContain(
      'profile-skeleton-save'
    );
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Вітаємо!')).not.toBeInTheDocument();
  });

  it.each([
    ['the skeleton', 'loading', (): HTMLElement => skeletonRoot()],
    ['the failure', 'failed', (): HTMLElement => screen.getByText(FAILED, { selector: 'p' })],
  ] as const)('frames %s in the profile card so the card does not jump', (_, status, inner) => {
    render(card({ status }), { wrapper });

    const frames = screen
      .getAllByRole('generic', { hidden: true })
      .filter((node) => styleRuleFor(node)?.getPropertyValue('border') === '1px solid #E1E7EA');

    expect(frames).toHaveLength(1);
    expect(frames[0]).toContainElement(inner());
    expect(styleRuleFor(frames[0] as HTMLElement)?.getPropertyValue('border-radius')).toBe(
      '0.75rem'
    );
  });

  it('hides every skeleton block from the accessibility tree', () => {
    render(card(), { wrapper });
    const isBlock = (node: HTMLElement): boolean => node.id.startsWith('profile-skeleton-');
    const hidden = screen.getAllByRole('generic', { hidden: true });
    const blocks = hidden.filter(isBlock);
    const root = hidden.find(
      (node) => node.getAttribute('aria-hidden') === 'true' && !isBlock(node)
    );

    expect(blocks).toHaveLength(16);
    blocks.forEach((block) => expect(root).toContainElement(block));
    expect(screen.queryAllByRole('generic').filter(isBlock)).toHaveLength(0);
    expect(within(screen.getByRole('main')).queryByRole('img')).not.toBeInTheDocument();
  });

  it('mounts the loading status empty and fills it after the first commit', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(wrapper({ children: card() }));

    expect(within(host).getByRole('status')).toBeEmptyDOMElement();
    expect(within(host).getByRole('alert')).toBeEmptyDOMElement();

    render(card(), { wrapper });

    expect(screen.getByRole('status')).toHaveTextContent(LOADING);
  });

  it('announces the failure through the mounted alert region with a described retry', () => {
    render(card({ status: 'failed' }), { wrapper });

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(screen.getByRole('alert')).not.toContainElement(
      screen.getByRole('button', { name: RETRY })
    );
    expect(screen.getByRole('button', { name: RETRY })).toHaveAccessibleDescription(FAILED);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('keeps one alert element that empties on a retry and fills on a new failure', async () => {
    const view = render(card(), { wrapper });
    const alert = screen.getByRole('alert');
    expect(alert).toBeEmptyDOMElement();

    view.rerender(card({ status: 'failed' }));
    expect(alert).toHaveTextContent(FAILED);

    view.rerender(card({ status: 'loading', refocus: true }));
    expect(alert).toBeEmptyDOMElement();

    view.rerender(card({ status: 'failed', refocus: true }));
    expect(await screen.findByRole('button', { name: RETRY })).toHaveFocus();
    expect(screen.getByRole('alert')).toBe(alert);
    expect(alert).toHaveTextContent(FAILED);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('draws the repository focus ring on the retry button', () => {
    render(card({ status: 'failed' }), { wrapper });

    const retry = screen.getByRole('button', { name: RETRY });
    const ring = styleRuleFor(retry, doubledClass(retry, ':focus-visible'));

    expect(ring?.getPropertyValue('outline')).toBe('2px solid #1A1C1E');
    expect(ring?.getPropertyValue('outline-offset')).toBe('2px');
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
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it.each(['loading', 'failed'] as const)(
    'keeps the form off the page while a retry is %s even though the entity is kept',
    (status) => {
      render(card({ status, user: buildUserEntity({ fullName: 'Олена Петренко' }) }), { wrapper });

      expect(screen.queryByText('Вітаємо!')).not.toBeInTheDocument();
      expect(screen.queryByText('Олена Петренко')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    }
  );

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
