// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import AuthFormSection from '@/modules/user/features/auth/components/auth-form-section';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

jest.mock('@auth/components/form-section/components/auth-provider-buttons', () => ({
  __esModule: true,
  default: (): ReactElement => <div>oauth-row</div>,
}));

jest.mock('@auth/components/form-section/inert-box', () => ({
  __esModule: true,
  default: ({ inert, children }: { inert: boolean; children: ReactNode }): ReactElement => (
    <div role="group" aria-label="OAuth providers" data-inert={String(inert)}>
      {children}
    </div>
  ),
}));

function renderSection(oauthInert: boolean): void {
  renderWithProviders(
    <AuthFormSection oauthInert={oauthInert} switcher={<a href="/sign-in">switch</a>}>
      <div>form-child</div>
    </AuthFormSection>
  );
}

describe('AuthFormSection', () => {
  it('renders the children, the OAuth row, and the switcher slot (AC1)', () => {
    renderSection(false);

    expect(screen.getByText('form-child')).toBeInTheDocument();
    expect(screen.getByText('oauth-row')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'switch' })).toBeInTheDocument();
  });

  it('marks the OAuth row inert when oauthInert is true (AC2)', () => {
    renderSection(true);

    expect(screen.getByRole('group', { name: 'OAuth providers' })).toHaveAttribute(
      'data-inert',
      'true'
    );
  });

  it('leaves the OAuth row not inert when oauthInert is false (AC2)', () => {
    renderSection(false);

    expect(screen.getByRole('group', { name: 'OAuth providers' })).toHaveAttribute(
      'data-inert',
      'false'
    );
  });
});
