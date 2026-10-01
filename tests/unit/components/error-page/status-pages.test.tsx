// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactElement } from 'react';

import Forbidden from '@/components/forbidden/forbidden';
import NotFound from '@/components/not-found/not-found';
import ServerError from '@/components/server-error/server-error';
import type { ErrorPageProps } from '@/components/types/error-page';

jest.mock('@/components/error-page', () => ({
  __esModule: true,
  default: jest.fn(({ variant, landmark }: ErrorPageProps): ReactElement => (
    <h1>
      {variant}:{landmark}
    </h1>
  )),
}));

const errorPageMock = (): jest.Mock =>
  jest.requireMock<{ default: jest.Mock }>('@/components/error-page').default;

const PAGES: [name: string, Page: ComponentType, variant: string][] = [
  ['NotFound', NotFound, 'notFound'],
  ['Forbidden', Forbidden, 'forbidden'],
  ['ServerError', ServerError, 'serverError'],
];

describe.each(PAGES)('%s', (_name, Page, variant) => {
  beforeEach(() => {
    errorPageMock().mockClear();
  });

  it('renders the shared error page for its variant in the main landmark', () => {
    render(<Page />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${variant}:main`);
    expect(errorPageMock()).toHaveBeenCalledTimes(1);
    expect(errorPageMock().mock.calls[0]?.[0]).toEqual({ variant, landmark: 'main' });
  });

  it('renders no link, button or navigation of its own', () => {
    render(<Page />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
