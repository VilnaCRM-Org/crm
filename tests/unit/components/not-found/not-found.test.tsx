// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

jest.mock('@/components/ui-back-to-main', () => ({
  __esModule: true,
  default: (): ReactElement => <nav aria-label="back-to-main" />,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => <footer />,
}));

jest.mock('@/components/ui-button', () => ({
  __esModule: true,
  default: ({ children, to }: { children: ReactNode; to: string }): ReactElement => (
    <a href={to}>{children}</a>
  ),
}));

jest.mock('@/components/ui-typography', () => ({
  __esModule: true,
  default: ({ children, component }: { children: ReactNode; component?: string }): ReactElement => {
    const Tag = (component ?? 'p') as keyof JSX.IntrinsicElements;
    return <Tag>{children}</Tag>;
  },
}));

jest.mock('@/hooks/use-page-title', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const NotFound = jest.requireActual<typeof import('@/components/not-found/not-found')>(
  '@/components/not-found/not-found'
).default;

describe('NotFound', () => {
  it('renders a main landmark (AC1)', () => {
    render(<NotFound />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders exactly one h1 heading inside main (AC1)', () => {
    render(<NotFound />);
    const main = screen.getByRole('main');
    const heading = screen.getByRole('heading', { level: 1 });
    expect(main).toContainElement(heading);
  });

  it('heading text comes from not_found.title (AC1)', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('not_found.title');
  });

  it('description text comes from not_found.description (AC1)', () => {
    render(<NotFound />);
    expect(screen.getByText('not_found.description')).toBeInTheDocument();
  });

  it('renders a link to home with not_found.cta text (AC2)', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: 'not_found.cta' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('does not render any element with role="alert" (AR2)', () => {
    render(<NotFound />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls usePageTitle with not_found.title (AR4)', () => {
    const usePageTitle = jest.requireMock<{ default: jest.Mock }>('@/hooks/use-page-title').default;
    render(<NotFound />);
    expect(usePageTitle).toHaveBeenCalledWith('not_found.title');
  });
});
