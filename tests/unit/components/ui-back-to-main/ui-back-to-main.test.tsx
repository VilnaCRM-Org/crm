import { screen, within } from '@testing-library/react';
import i18n, { type i18n as I18nType } from 'i18next';

import UIBackToMain from '@/components/ui-back-to-main';
import localization from '@/i18n/localization.json';

import renderWithProviders from '../../utils/render-with-providers';

jest.mock('@/assets/icons/arrows/back-arrow.svg', () => 'back-arrow-mock.svg');

const englishLabel: string = 'Back to homepage';
const ukrainianLabel: string = 'На головну сторінку';

const ukrainianI18n = async (): Promise<I18nType> => {
  const instance = i18n.createInstance();
  await instance.init({
    lng: 'uk',
    fallbackLng: 'uk',
    resources: { uk: { translation: localization.uk.translation } },
    interpolation: { escapeValue: false },
  });
  return instance;
};

const focusVisibleStyleOf = (element: HTMLElement): CSSStyleDeclaration | undefined => {
  const selectors = Array.from(element.classList, (name) => `.${name}:focus-visible`);

  return Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules))
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
    .find((rule) => selectors.includes(rule.selectorText))?.style;
};

describe('UIBackToMain', () => {
  it('renders a link home named by the translated label', () => {
    renderWithProviders(<UIBackToMain />);

    const link = screen.getByRole('link', { name: englishLabel });

    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveAttribute('aria-label', englishLabel);
    expect(within(link).getByText(englishLabel)).toBeInTheDocument();
  });

  it('wraps the link in a section band', () => {
    renderWithProviders(<UIBackToMain />);

    const band = screen.getAllByRole('generic').find((element) => element.tagName === 'SECTION');

    expect(band).toContainElement(screen.getByRole('link', { name: englishLabel }));
  });

  it('names the link with the Ukrainian label under the uk locale', async () => {
    renderWithProviders(<UIBackToMain />, { i18nMock: await ukrainianI18n() });

    const link = screen.getByRole('link', { name: ukrainianLabel });

    expect(link).toHaveAttribute('aria-label', ukrainianLabel);
    expect(within(link).getByText(ukrainianLabel)).toBeInTheDocument();
  });

  it('renders the CRM back arrow as a decorative image inside a hidden wrapper', () => {
    renderWithProviders(<UIBackToMain />);

    const icon = within(screen.getByRole('link', { name: englishLabel })).getByRole(
      'presentation',
      { hidden: true }
    );

    expect(icon).toHaveAttribute('src', 'back-arrow-mock.svg');
    expect(icon).toHaveAttribute('alt', '');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
  });

  it('draws the keyboard focus ring in the high-contrast dark ink', () => {
    renderWithProviders(<UIBackToMain />);

    const focusStyle = focusVisibleStyleOf(screen.getByRole('link', { name: englishLabel }));

    expect(focusStyle?.getPropertyValue('outline')).toBe('2px solid #1A1C1E');
    expect(focusStyle?.getPropertyValue('outline-offset')).toBe('2px');
  });
});
