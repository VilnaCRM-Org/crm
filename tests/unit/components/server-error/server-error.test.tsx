// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import type { ErrorPageProps } from '@/components/types/error-page';

jest.mock('@/components/error-page', () => ({
  __esModule: true,
  default: jest.fn(({ variant, landmark }: ErrorPageProps): ReactElement => (
    <h1>
      {variant}:{landmark}
    </h1>
  )),
}));

const ServerError = jest.requireActual<typeof import('@/components/server-error/server-error')>(
  '@/components/server-error/server-error'
).default;

const errorPageMock = (): jest.Mock =>
  jest.requireMock<{ default: jest.Mock }>('@/components/error-page').default;

describe('ServerError', () => {
  beforeEach(() => {
    errorPageMock().mockClear();
  });

  it('renders the shared error page as the 5xx variant in the main landmark', () => {
    render(<ServerError />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('serverError:main');
    expect(errorPageMock()).toHaveBeenCalledTimes(1);
    expect(errorPageMock().mock.calls[0]?.[0]).toEqual({
      variant: 'serverError',
      landmark: 'main',
    });
  });

  it('renders no link or button of its own', () => {
    render(<ServerError />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
