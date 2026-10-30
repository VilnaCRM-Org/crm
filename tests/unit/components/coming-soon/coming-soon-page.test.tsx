import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import ComingSoonPage from '@/components/coming-soon';
import comingSoonSections from '@/components/coming-soon/coming-soon-sections';
import ROUTE_PATHS from '@/routes/route-paths';
import createComingSoonLocaleI18n from '@tests/unit/utils/create-coming-soon-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

type Locale = Parameters<typeof createComingSoonLocaleI18n>[0];

const SECTIONS: readonly (readonly [string, string, string])[] = [
  [ROUTE_PATHS.boards, 'Дошки', 'Boards'],
  [ROUTE_PATHS.products, 'Продукти', 'Products'],
  [ROUTE_PATHS.orders, 'Замовлення', 'Orders'],
  [ROUTE_PATHS.contacts, 'Контакти', 'Contacts'],
  [ROUTE_PATHS.analytics, 'Аналітика', 'Analytics'],
  [ROUTE_PATHS.settingsIntegrations, 'Інтеграції', 'Integrations'],
  [ROUTE_PATHS.settingsWebhooks, 'Вебхуки', 'Webhooks'],
  [ROUTE_PATHS.settingsBilling, 'Білінг', 'Billing'],
];

const renderPage = (path: string, locale: Locale = 'uk'): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={createComingSoonLocaleI18n(locale, ['en', 'uk'])}>
      <MemoryRouter initialEntries={[path]}>
        <main>
          <ComingSoonPage />
        </main>
      </MemoryRouter>
    </I18nextProvider>
  );

describe('ComingSoonPage', () => {
  it.each(SECTIONS)('names %s as the only h1 and sets the uk document title', (path, uk) => {
    renderPage(path);

    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: uk })).toBeInTheDocument();
    expect(document.title).toBe(`${uk} - VilnaCRM`);
  });

  it.each(SECTIONS)('names %s in en when the locale is en', (path, _uk, en) => {
    renderPage(path, 'en');

    expect(screen.getByRole('heading', { level: 1, name: en })).toBeInTheDocument();
    expect(document.title).toBe(`${en} - VilnaCRM`);
  });

  it('renders the proposed message in uk and en', () => {
    const { unmount } = renderPage(ROUTE_PATHS.boards);

    expect(
      screen.getByText('Цей розділ ще в розробці. Ми повідомимо, щойно він запрацює.')
    ).toBeInTheDocument();
    unmount();
    renderPage(ROUTE_PATHS.boards, 'en');

    expect(
      screen.getByText('This section is coming soon. We will let you know when it is ready.')
    ).toBeInTheDocument();
  });

  it('renders the message as a paragraph after the heading and the home link last', () => {
    renderPage(ROUTE_PATHS.orders, 'en');

    const heading = screen.getByRole('heading', { level: 1 });
    const message = screen.getByText(/coming soon/);
    const link = screen.getByRole('link', { name: 'Back to the home page' });

    expect(message.tagName).toBe('P');
    expect(heading.compareDocumentPosition(message)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(message.compareDocumentPosition(link)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('adds no main landmark of its own, no status digit, no form and no live region', () => {
    renderPage(ROUTE_PATHS.boards);

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).not.toHaveTextContent(/\d/);
  });

  it('does not move focus to the heading on mount, because AppLayout owns arrival focus', () => {
    renderPage(ROUTE_PATHS.boards);

    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it.each(['/boards/', '/Boards'])(
    'finds its section for the router-equivalent path %s',
    (path) => {
      renderPage(path, 'en');

      expect(screen.getByRole('heading', { level: 1, name: 'Boards' })).toBeInTheDocument();
    }
  );

  it('renders nothing for a path outside the section set', () => {
    renderPage('/not-planned');

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('restores the base title when it unmounts', () => {
    const { unmount } = renderPage(ROUTE_PATHS.boards);
    unmount();

    expect(document.title).toBe('VilnaCRM');
  });

  it('serves all eight sections the route table loads it for', () => {
    expect(comingSoonSections.items).toHaveLength(SECTIONS.length);
  });

  it.each(['uk', 'en'] as const)('has no axe violations in %s', async (locale) => {
    const { container } = renderPage(ROUTE_PATHS.settingsBilling, locale);

    await expectNoA11yViolations(container);
  });
});
