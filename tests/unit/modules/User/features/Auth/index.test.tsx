import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import Authentication from '@/modules/User/features/Auth';

jest.mock('@/styles/theme', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@/modules/BackToMain', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-header" />,
}));

jest.mock('@/components/UIFooter', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-footer" />,
}));

jest.mock('@/components/Skeletons/AuthSkeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-skeleton" />,
}));

jest.mock('@/modules/User/features/Auth/components/FormSection', () => ({
  __esModule: true,
  default: (): never => {
    throw new Promise<void>((): void => {
      // keep pending to force suspense fallback
    });
  },
}));

describe('Authentication shell', () => {
  it('keeps header and footer visible while form section is loading', () => {
    render(<Authentication />);

    expect(screen.getByTestId('auth-shell-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-footer')).toBeInTheDocument();
  });
});
