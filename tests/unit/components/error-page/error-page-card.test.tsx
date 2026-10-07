import '@testing-library/jest-dom';
import { act, render, type RenderResult, screen } from '@testing-library/react';
import type { i18n as I18nType } from 'i18next';
import { I18nextProvider } from 'react-i18next';

import ErrorPageCard from '@/components/error-page/error-page-card';
import type { ErrorPageVariantId } from '@/components/types/error-page';

import createLocaleI18n from '../../utils/create-locale-i18n';
import { winningMediaValueFor } from '../../utils/emotion-style-rules';

interface CardCopy {
  title: string;
  code: string;
  description: string;
}

const UK_COPY: Record<ErrorPageVariantId, CardCopy> = {
  notFound: {
    title: 'Помилка 404',
    code: 'Код помилки: 404',
    description: 'Сторінки не існує',
  },
  forbidden: {
    title: 'В доступі відмовлено',
    code: 'Код помилки: 403',
    description: 'На жаль, у вас немає прав доступу до цієї сторінки',
  },
  serverError: {
    title: 'Помилка сервера',
    code: 'Код помилки: 5xx',
    description: 'Сервер тимчасово недоступний. Спробуйте пізніше.',
  },
};

const EN_COPY: Record<ErrorPageVariantId, CardCopy> = {
  notFound: {
    title: 'Error 404',
    code: 'Error code: 404',
    description: 'This page does not exist',
  },
  forbidden: {
    title: 'Access denied',
    code: 'Error code: 403',
    description: 'Unfortunately, you do not have permission to access this page',
  },
  serverError: {
    title: 'Server error',
    code: 'Error code: 5xx',
    description: 'The server is temporarily unavailable. Please try again later.',
  },
};

const VARIANTS: ErrorPageVariantId[] = ['notFound', 'forbidden', 'serverError'];
const MOBILE_QUERY = '(max-width:767.95px)';

const createBilingualI18n = (): I18nType => createLocaleI18n('uk', ['en']);

const renderCard = (variant: ErrorPageVariantId, i18n: I18nType): RenderResult =>
  render(
    <I18nextProvider i18n={i18n}>
      <ErrorPageCard variant={variant} />
    </I18nextProvider>
  );

const expectCopy = ({ title, code, description }: CardCopy): void => {
  const heading = screen.getByRole('heading', { level: 1 });
  const codeLine = screen.getByText(code);
  const descriptionLine = screen.getByText(description);

  expect(heading).toHaveTextContent(new RegExp(`^${title}$`));
  expect(codeLine.tagName).toBe('P');
  expect(descriptionLine.tagName).toBe('P');
  expect(heading.compareDocumentPosition(codeLine)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(codeLine.compareDocumentPosition(descriptionLine)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
};

describe('ErrorPageCard', () => {
  it.each(VARIANTS)('focuses the only h1 after mount for %s', (variant) => {
    renderCard(variant, createBilingualI18n());

    const headings = screen.getAllByRole('heading', { level: 1 });

    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAttribute('id', 'error-page-title');
    expect(headings[0]).toHaveAttribute('tabindex', '-1');
    expect(headings[0]).toHaveFocus();
  });

  it('focuses the h1 again on a keyed remount', () => {
    const i18n = createBilingualI18n();
    const view = render(
      <I18nextProvider i18n={i18n}>
        <ErrorPageCard key="first" variant="notFound" />
      </I18nextProvider>
    );
    const first = screen.getByRole('heading', { level: 1 });

    view.rerender(
      <I18nextProvider i18n={i18n}>
        <ErrorPageCard key="second" variant="notFound" />
      </I18nextProvider>
    );
    const second = screen.getByRole('heading', { level: 1 });

    expect(second).not.toBe(first);
    expect(second).toHaveFocus();
  });

  it.each(VARIANTS)('renders the uk title, status code and description for %s', (variant) => {
    renderCard(variant, createBilingualI18n());

    expectCopy(UK_COPY[variant]);
  });

  it.each(VARIANTS)('switches %s to the en copy without a reload', async (variant) => {
    const i18n = createBilingualI18n();
    renderCard(variant, i18n);
    const heading = screen.getByRole('heading', { level: 1 });

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    expectCopy(EN_COPY[variant]);
    expect(screen.getByRole('heading', { level: 1 })).toBe(heading);
  });

  it('ships the correct uk orthography in the forbidden description', () => {
    renderCard('forbidden', createBilingualI18n());

    const description = screen.getByText(UK_COPY.forbidden.description);

    expect(description).toHaveTextContent(/^На жаль,/);
    expect(description).not.toHaveTextContent(/Нажаль/);
  });

  it('keeps the description plain text, never an alert or a live region', () => {
    renderCard('serverError', createBilingualI18n());

    const description = screen.getByText(UK_COPY.serverError.description);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(description).not.toHaveAttribute('role');
    expect(description).not.toHaveAttribute('aria-live');
  });

  it.each([
    ['notFound', '25.741px', '3.74px 0 16px'],
    ['forbidden', '23.261px', '8px 0 16px'],
    ['serverError', '19.261px', '8px 0 8px'],
  ] as const)(
    'applies the %s mobile frame bottom padding and description gaps',
    (variant, paddingBottom, margin) => {
      renderCard(variant, createBilingualI18n());

      const heading = screen.getByRole('heading', { level: 1 });
      const card = screen
        .getAllByRole('generic')
        .filter((element) => element.contains(heading))
        .at(-1);
      if (card === undefined) throw new Error('The card wrapping the heading is missing');
      const description = screen.getByText(UK_COPY[variant].description);

      expect(winningMediaValueFor(card, MOBILE_QUERY, 'padding-bottom')).toBe(paddingBottom);
      expect(winningMediaValueFor(description, MOBILE_QUERY, 'margin')).toBe(margin);
    }
  );

  it('renders the actions row inside the card', () => {
    renderCard('forbidden', createBilingualI18n());

    expect(screen.getByRole('link', { name: 'На головну' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Запросити доступ' })).toBeInTheDocument();
  });

  it('places no element in the tab order with a positive tabindex', () => {
    renderCard('forbidden', createBilingualI18n());

    const focusables = [
      screen.getByRole('heading', { level: 1 }),
      screen.getByRole('link', { name: 'На головну' }),
      screen.getByRole('button', { name: 'Запросити доступ' }),
    ];

    expect(focusables.map((element) => element.tabIndex)).toEqual([-1, 0, 0]);
  });
});
