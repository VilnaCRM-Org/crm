import { fireEvent, render, screen } from '@testing-library/react';
import type { i18n as I18nType } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import Home from '@/features/home';
import localization from '@/i18n/localization.json';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import { styleRuleFor, winningMediaValueFor } from '@tests/unit/utils/emotion-style-rules';

const { en, uk } = {
  en: localization.en.translation.home,
  uk: localization.uk.translation.home,
};

function renderHome(signOut: jest.Mock, i18n: I18nType = createLocaleI18n('en')): void {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={{ signOut }} />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
}

describe('Home page', () => {
  it('ships the approved English copy', () => {
    expect(en).toEqual({
      title: 'Home',
      heading: 'Welcome to VilnaCRM',
      description: 'CRM sections will appear here once they are connected.',
      sign_out: 'Sign out',
    });
  });

  it('ships the approved Ukrainian copy', () => {
    expect(uk).toEqual({
      title: 'Головна',
      heading: 'Ласкаво просимо до VilnaCRM',
      description: 'Розділи CRM з’являться тут, щойно їх буде підключено.',
      sign_out: 'Вийти',
    });
  });

  it('renders exactly one level-1 heading from the English catalog', () => {
    renderHome(jest.fn());

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: en.heading })).toBeInTheDocument();
  });

  it('renders the heading from the Ukrainian catalog', () => {
    renderHome(jest.fn(), createLocaleI18n('uk'));

    expect(screen.getByRole('heading', { level: 1, name: uk.heading })).toBeInTheDocument();
  });

  it('describes the page in a paragraph', () => {
    renderHome(jest.fn());

    const description = screen.getByText(en.description);

    expect(description.tagName).toBe('P');
  });

  it('renders the Ukrainian description', () => {
    renderHome(jest.fn(), createLocaleI18n('uk'));

    expect(screen.getByText(uk.description)).toBeInTheDocument();
  });

  it('renders sign out as a native non-submitting button named by its visible label', () => {
    renderHome(jest.fn());

    const button = screen.getByRole('button', { name: en.sign_out });

    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-label');
    expect(button).not.toHaveAttribute('href');
    expect(button).toHaveTextContent(en.sign_out);
    expect(button).toHaveClass('MuiButton-outlined');
  });

  it('gives sign out a dark label, a 44px floor and a visible keyboard focus ring', () => {
    renderHome(jest.fn());

    const button = screen.getByRole('button', { name: en.sign_out });
    const focusRing = styleRuleFor(button, ':focus-visible');

    expect(button).toHaveStyle({ color: '#1A1C1E', minHeight: '2.75rem' });
    expect(focusRing?.getPropertyValue('outline')).toBe('2px solid #1A1C1E');
    expect(focusRing?.getPropertyValue('outline-offset')).toBe('2px');
  });

  it('draws sign out as the Figma secondary pill at every breakpoint', () => {
    renderHome(jest.fn());

    const button = screen.getByRole('button', { name: en.sign_out });

    expect(button).toHaveStyle({
      padding: '16px 24px',
      borderRadius: '57px',
      borderColor: '#969B9D',
      fontWeight: '500',
      fontSize: '0.9375rem',
      lineHeight: '1.2',
      textTransform: 'none',
    });
    expect(winningMediaValueFor(button, 'max-width:1024px', 'padding')).toBe('16px 24px');
    expect(winningMediaValueFor(button, 'max-width:375px', 'padding')).toBe('16px 24px');
    expect(winningMediaValueFor(button, 'max-width:375px', 'margin-bottom')).toBe('0px');
  });

  it('draws the heading in the Figma dashboard title style', () => {
    renderHome(jest.fn());

    expect(screen.getByRole('heading', { level: 1 })).toHaveStyle({
      color: '#1A1C1E',
      fontWeight: '700',
      fontSize: '1.375rem',
    });
  });

  it('names the sign out button in Ukrainian', () => {
    renderHome(jest.fn(), createLocaleI18n('uk'));

    expect(screen.getByRole('button', { name: uk.sign_out })).toBeInTheDocument();
  });

  it('calls the protected outlet signOut exactly once per click', () => {
    const signOut = jest.fn();
    renderHome(signOut);

    fireEvent.click(screen.getByRole('button', { name: en.sign_out }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('titles the document from the home.title key', () => {
    renderHome(jest.fn());

    expect(document.title).toBe(`${en.title} - VilnaCRM`);
  });

  it('titles the document in Ukrainian', () => {
    renderHome(jest.fn(), createLocaleI18n('uk'));

    expect(document.title).toBe(`${uk.title} - VilnaCRM`);
  });

  it('never renders a raw translation key', () => {
    renderHome(jest.fn(), createLocaleI18n('uk'));

    expect(screen.queryByText(/home\./)).not.toBeInTheDocument();
  });
});
