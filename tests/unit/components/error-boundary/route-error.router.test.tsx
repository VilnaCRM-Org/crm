// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';

import createLocaleI18n from '../../utils/create-locale-i18n';

const TRY_AGAIN = 'Try again';
const englishI18n = createLocaleI18n('en');

function Providers({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={englishI18n}>{children}</I18nextProvider>;
}

describe('RouteError inside a data router', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retries the index route in place without rewriting the URL to /?index', async () => {
    let throwing = true;
    function Page(): JSX.Element {
      if (throwing) throw new Error('page failed');
      return (
        <main tabIndex={-1}>
          <p>page content</p>
        </main>
      );
    }
    const errorElement = <RouteError landmark="main" />;
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Outlet />,
          children: [{ index: true, element: <Page />, errorElement }],
        },
      ],
      { initialEntries: ['/?tab=2#top'] }
    );
    const onRouteError = jest.fn();
    const onCaughtError = jest.fn();

    render(<RouterProvider router={router} onError={onRouteError} />, {
      wrapper: Providers,
      onCaughtError,
    });
    expect(await screen.findByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
    expect(onRouteError).toHaveBeenCalledTimes(1);

    throwing = false;
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(await screen.findByText('page content')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(router.state.location.search).toBe('?tab=2');
    expect(router.state.location.hash).toBe('#top');
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });
});
