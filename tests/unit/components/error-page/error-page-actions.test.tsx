import '@testing-library/jest-dom';
import { act, fireEvent, render, type RenderResult, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import ErrorPageActions from '@/components/error-page/error-page-actions';
import type { ErrorPageVariantId } from '@/components/types/error-page';

import createLocaleI18n from '../../utils/create-locale-i18n';

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

describe('ErrorPageActions', () => {
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
