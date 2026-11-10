import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import type { i18n as I18nType } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import UIShellContent from '@/components/ui-shell-content';
import Home from '@/features/home';
import localization from '@/i18n/localization.json';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const { en, uk } = {
  en: localization.en.translation.home,
  uk: localization.uk.translation.home,
};

function renderHome(i18n: I18nType = createLocaleI18n('en')): ReturnType<typeof render> {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </I18nextProvider>
  );
}

describe('Home page', () => {
  it('ships the approved English copy and nothing else', () => {
    expect(en).toEqual({
      title: 'Home',
      heading: 'Welcome to VilnaCRM',
      description: 'CRM sections will appear here once they are connected.',
    });
  });

  it('ships the approved Ukrainian copy and nothing else', () => {
    expect(uk).toEqual({
      title: 'Головна',
      heading: 'Ласкаво просимо до VilnaCRM',
      description: 'Розділи CRM з’являться тут, щойно їх буде підключено.',
    });
  });

  it('renders exactly one level-1 heading from the English catalog', () => {
    renderHome();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: en.heading })).toBeInTheDocument();
  });

  it('renders the heading from the Ukrainian catalog', () => {
    renderHome(createLocaleI18n('uk'));

    expect(screen.getByRole('heading', { level: 1, name: uk.heading })).toBeInTheDocument();
  });

  it('describes the page in a paragraph', () => {
    renderHome();

    expect(screen.getByText(en.description).tagName).toBe('P');
  });

  it('renders the Ukrainian description', () => {
    renderHome(createLocaleI18n('uk'));

    expect(screen.getByText(uk.description)).toBeInTheDocument();
  });

  it('holds no sign out control and no link, because the shell owns both (FR-16)', () => {
    renderHome();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('draws the heading in the Figma dashboard title style', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1 })).toHaveStyle({
      color: '#1A1C1E',
      fontWeight: '700',
      fontSize: '1.375rem',
    });
  });

  it('starts its content at the shell content insets, as the settings page does (NFR-22)', () => {
    const view = render(<UIShellContent>probe</UIShellContent>);
    const shellContent = screen.getByText('probe').className;
    view.unmount();
    renderHome();

    const holders = screen
      .getAllByRole('generic')
      .filter((box) => box.className === shellContent)
      .filter((box) => within(box).queryByRole('heading', { level: 1 }) !== null);

    expect(holders).toHaveLength(1);
  });

  it('titles the document from the home.title key', () => {
    renderHome();

    expect(document.title).toBe(`${en.title} - VilnaCRM`);
  });

  it('titles the document in Ukrainian', () => {
    renderHome(createLocaleI18n('uk'));

    expect(document.title).toBe(`${uk.title} - VilnaCRM`);
  });

  it('never renders a raw translation key', () => {
    renderHome(createLocaleI18n('uk'));

    expect(screen.queryByText(/home\./)).not.toBeInTheDocument();
  });

  it('has no axe violations inside a main landmark', async () => {
    const { container } = render(
      <I18nextProvider i18n={createLocaleI18n('uk')}>
        <MemoryRouter>
          <main>
            <Home />
          </main>
        </MemoryRouter>
      </I18nextProvider>
    );

    await expectNoA11yViolations(container);
  });
});
