import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import AuthPageLayout from '@auth/components/auth-page-layout';

jest.mock('@/components/ui-back-to-main', () => ({
  __esModule: true,
  default: (): ReactElement => <nav aria-label="back" />,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => <footer />,
}));

jest.mock('@/components/skeletons/auth-skeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <div />,
}));

describe('AuthPageLayout main region', () => {
  it('lets the main region grow as a vertical flex column', () => {
    render(
      <AuthPageLayout>
        <p>child</p>
      </AuthPageLayout>
    );

    expect(screen.getByRole('main')).toHaveStyle({
      flexGrow: '1',
      display: 'flex',
      flexDirection: 'column',
    });
  });

  it('does not lay the main region out as a row', () => {
    render(
      <AuthPageLayout>
        <p>child</p>
      </AuthPageLayout>
    );

    expect(screen.getByRole('main')).not.toHaveStyle({ flexDirection: 'row' });
    expect(screen.getByRole('main')).not.toHaveStyle({ display: 'block' });
  });
});
