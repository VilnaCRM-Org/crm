import '@testing-library/jest-dom';
import { act, fireEvent, render, type RenderResult, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import ErrorPageActions from '@/components/error-page/components/error-page-actions';
import type { ErrorPageVariantId } from '@/components/types/error-page';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import { winningMediaValueFor } from '@tests/unit/utils/emotion-style-rules';

const HOME = 'На головну';
const REQUEST_ACCESS = 'Запросити доступ';

function renderActions(variant: ErrorPageVariantId): RenderResult {
  return render(
    <I18nextProvider i18n={createLocaleI18n('uk')}>
      <ErrorPageActions variant={variant} />
    </I18nextProvider>
  );
}

function actionsRow(): HTMLElement | undefined {
  return screen.getAllByRole('generic').find((element) => element.id === 'error-page-actions');
}

const MOBILE_QUERY = '(max-width:767.95px)';

function mockViewport(mobile: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: mobile && query === MOBILE_QUERY,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('ErrorPageActions', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('stacks the request-access button above the home link on mobile for forbidden', () => {
    mockViewport(true);
    renderActions('forbidden');

    const home = screen.getByRole('link', { name: HOME });
    const requestAccess = screen.getByRole('button', { name: REQUEST_ACCESS });

    expect(requestAccess.compareDocumentPosition(home)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(actionsRow()).toContainElement(home);
  });

  it('keeps the home link first above the mobile breakpoint for forbidden', () => {
    mockViewport(false);
    renderActions('forbidden');

    const home = screen.getByRole('link', { name: HOME });
    const requestAccess = screen.getByRole('button', { name: REQUEST_ACCESS });

    expect(home.compareDocumentPosition(requestAccess)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('stretches both forbidden actions to the row width below the mobile breakpoint', () => {
    renderActions('forbidden');

    const home = screen.getByRole('link', { name: HOME });
    const requestAccess = screen.getByRole('button', { name: REQUEST_ACCESS });

    expect(winningMediaValueFor(home, MOBILE_QUERY, 'width')).toBe('100%');
    expect(winningMediaValueFor(requestAccess, MOBILE_QUERY, 'width')).toBe('100%');
  });

  it.each<ErrorPageVariantId>(['notFound', 'serverError'])(
    'keeps the single %s home link at its own width on mobile',
    (variant) => {
      renderActions(variant);

      const home = screen.getByRole('link', { name: HOME });

      expect(winningMediaValueFor(home, MOBILE_QUERY, 'width')).toBeUndefined();
    }
  );

  it('renders only the home link on mobile for notFound', () => {
    mockViewport(true);
    renderActions('notFound');

    expect(screen.getByRole('link', { name: HOME })).toHaveClass('MuiButton-contained');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it.each<ErrorPageVariantId>(['notFound', 'serverError'])(
    'renders one contained home link and no button for %s',
    (variant) => {
      renderActions(variant);

      const home = screen.getByRole('link', { name: HOME });

      expect(home).toHaveAttribute('href', '/');
      expect(home).toHaveClass('MuiButton-contained');
      expect(actionsRow()).toContainElement(home);
      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(screen.queryByText(REQUEST_ACCESS)).not.toBeInTheDocument();
    }
  );

  it('renders an outlined home link followed by the request-access button for forbidden', () => {
    renderActions('forbidden');

    const home = screen.getByRole('link', { name: HOME });
    const requestAccess = screen.getByRole('button', { name: REQUEST_ACCESS });

    expect(home).toHaveAttribute('href', '/');
    expect(home).toHaveClass('MuiButton-outlined');
    expect(home).not.toHaveClass('MuiButton-contained');
    expect(requestAccess).toHaveClass('MuiButton-contained');
    expect(actionsRow()).toContainElement(requestAccess);
    expect(home.compareDocumentPosition(requestAccess)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders the request-access button without an action', () => {
    const { container } = renderActions('forbidden');
    const requestAccess = screen.getByRole('button', { name: REQUEST_ACCESS });
    const before = container.innerHTML;
    const location = window.location.href;

    fireEvent.click(requestAccess);
    fireEvent.keyDown(requestAccess, { key: 'Enter' });
    fireEvent.keyUp(requestAccess, { key: ' ' });

    expect(requestAccess.tagName).toBe('BUTTON');
    expect(requestAccess).toHaveAttribute('type', 'button');
    expect(requestAccess).not.toHaveAttribute('href');
    expect(container.innerHTML).toBe(before);
    expect(window.location.href).toBe(location);
  });

  it('keeps the request-access button focusable and announces it as unavailable', () => {
    renderActions('forbidden');
    const requestAccess = screen.getByRole('button', { name: REQUEST_ACCESS });

    act(() => requestAccess.focus());

    expect(requestAccess).toHaveFocus();
    expect(requestAccess).toHaveAttribute('aria-disabled', 'true');
    expect(requestAccess).toBeEnabled();
    expect(requestAccess).not.toHaveAttribute('tabindex', '-1');
  });

  it('uses the shipped English labels', () => {
    render(
      <I18nextProvider i18n={createLocaleI18n('en')}>
        <ErrorPageActions variant="forbidden" />
      </I18nextProvider>
    );

    expect(screen.getByRole('link', { name: 'Go to homepage' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request access' })).toBeInTheDocument();
  });
});
