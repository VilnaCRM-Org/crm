import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import ErrorPage from '@/components/error-page';
import type { FallbackLandmark } from '@/components/types/error-boundary';
import type { ErrorPageVariantId } from '@/components/types/error-page';
import usePageTitle from '@/hooks/use-page-title';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

jest.mock('@/assets/illustrations/error-page/curve.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/diamond.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-columns.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-rows.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/logo/vilna-logo.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('@/hooks/use-page-title', () => {
  const actual =
    jest.requireActual<typeof import('@/hooks/use-page-title')>('@/hooks/use-page-title');
  return { __esModule: true, default: jest.fn(actual.default) };
});

const VARIANTS: [ErrorPageVariantId, string, string][] = [
  ['notFound', 'error_page.not_found.title', 'Error 404'],
  ['forbidden', 'error_page.forbidden.title', 'Access denied'],
  ['serverError', 'error_page.server_error.title', 'Server error'],
];

const renderPage = (
  variant: ErrorPageVariantId,
  landmark: FallbackLandmark,
  i18nMock = createLocaleI18n('en')
): ReturnType<typeof renderWithProviders> =>
  renderWithProviders(<ErrorPage variant={variant} landmark={landmark} />, { i18nMock });

describe('ErrorPage', () => {
  it.each(VARIANTS)('renders %s as the only main landmark with lang', (variant, _key, title) => {
    renderPage(variant, 'main');

    const main = screen.getByRole('main');

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(main.tagName).toBe('MAIN');
    expect(main).toHaveAttribute('lang', 'en');
    expect(main).not.toHaveAttribute('aria-labelledby');
    expect(main).toContainElement(screen.getByRole('heading', { level: 1, name: title }));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it.each(VARIANTS)(
    'renders %s as a section named by its h1 in region mode',
    (variant, _k, title) => {
      renderPage(variant, 'region');

      const region = screen.getByRole('region', { name: title });

      expect(region.tagName).toBe('SECTION');
      expect(region).toHaveAttribute('aria-labelledby', 'error-page-title');
      expect(region).toHaveAttribute('lang', 'en');
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    }
  );

  it('carries the resolved uk language on the landmark', () => {
    renderPage('forbidden', 'main', createLocaleI18n('uk'));

    expect(screen.getByRole('main')).toHaveAttribute('lang', 'uk');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('В доступі відмовлено');
  });

  it('falls back to lang="en" when no language resolved', () => {
    const unresolved = i18next.createInstance();
    unresolved.use(initReactI18next).init({
      lng: 'cimode',
      resources: { en: { translation: {} } },
      initAsync: false,
    });

    render(
      <MemoryRouter>
        <I18nextProvider i18n={unresolved}>
          <ErrorPage variant="notFound" landmark="main" />
        </I18nextProvider>
      </MemoryRouter>
    );

    expect(unresolved.resolvedLanguage).toBeUndefined();
    expect(screen.getByRole('main')).toHaveAttribute('lang', 'en');
  });

  it.each(VARIANTS)('renders the footer once, after the main landmark, for %s', (variant) => {
    renderPage(variant, 'main');

    const footers = screen.getAllByRole('contentinfo');
    const main = screen.getByRole('main');

    expect(footers).toHaveLength(1);
    expect(footers[0]?.tagName).toBe('FOOTER');
    expect(main).not.toContainElement(footers[0] ?? null);
    expect(main.compareDocumentPosition(footers[0] as HTMLElement)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it.each(VARIANTS)('renders no footer in region mode for %s', (variant) => {
    renderPage(variant, 'region');

    expect(screen.queryAllByRole('contentinfo')).toHaveLength(0);
  });

  it.each(VARIANTS)('sets the %s page title through usePageTitle', (variant, key, title) => {
    renderPage(variant, 'main');

    expect(usePageTitle).toHaveBeenCalledWith(key);
    expect(document.title).toBe(`${title} - VilnaCRM`);
  });

  it('resets the document title on unmount', () => {
    const { unmount } = renderPage('serverError', 'region');

    expect(document.title).toBe('Server error - VilnaCRM');

    unmount();

    expect(document.title).toBe('VilnaCRM');
  });

  it.each<FallbackLandmark>(['main', 'region'])(
    'renders exactly one h1 and no alert in %s mode',
    (landmark) => {
      renderPage('forbidden', landmark);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
  );

  it('paints the landmark with the page background and clips horizontal overflow', () => {
    renderPage('notFound', 'main');

    expect(screen.getByRole('main')).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'clip',
      backgroundColor: '#FBFBFB',
      paddingTop: '76px',
      paddingBottom: '121px',
    });
  });
});
