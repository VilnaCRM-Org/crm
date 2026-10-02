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

const NotFound = jest.requireActual<typeof import('@/components/not-found/not-found')>(
  '@/components/not-found/not-found'
).default;

const errorPageMock = (): jest.Mock =>
  jest.requireMock<{ default: jest.Mock }>('@/components/error-page').default;

describe('NotFound', () => {
  beforeEach(() => {
    errorPageMock().mockClear();
  });

  it('renders the shared error page as the 404 variant in the main landmark', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('notFound:main');
    expect(errorPageMock()).toHaveBeenCalledTimes(1);
    expect(errorPageMock().mock.calls[0]?.[0]).toEqual({ variant: 'notFound', landmark: 'main' });
  });

  it('renders no back-to-main link and no button of its own', () => {
    render(<NotFound />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
