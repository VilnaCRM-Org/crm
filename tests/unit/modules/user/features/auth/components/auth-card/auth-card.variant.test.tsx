import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import AuthCard from '@auth/components/auth-card';

jest.mock('@auth/components/auth-card/styles', () => ({
  __esModule: true,
  default: {
    recoveryCard: { borderTopColor: 'rgb(1, 2, 3)' },
    challengeCard: { borderBottomColor: 'rgb(4, 5, 6)' },
  },
}));

const cardOf = (): HTMLElement => {
  const card = screen.getAllByRole('generic').find((element) => element.id === 'auth-form-card');
  if (!card) throw new Error('No #auth-form-card was rendered');
  return card;
};

describe('AuthCard recovery variant', () => {
  it('adds the recovery card styles on top of the shared wrapper', () => {
    render(
      <AuthCard variant="recovery">
        <h1>Card heading</h1>
      </AuthCard>
    );

    expect(cardOf()).toHaveStyle({
      borderTopColor: 'rgb(1, 2, 3)',
      maxWidth: '22.6875rem',
      paddingBottom: '1.375rem',
    });
  });

  it('keeps the recovery styles off a card without the variant', () => {
    render(
      <AuthCard page="signIn">
        <h1>Card heading</h1>
      </AuthCard>
    );

    expect(cardOf()).not.toHaveStyle({ borderTopColor: 'rgb(1, 2, 3)' });
    expect(cardOf()).toHaveStyle({ paddingBottom: '1.3125rem' });
  });
});

describe('AuthCard challenge variant', () => {
  it('adds the challenge card styles and not the recovery ones', () => {
    render(
      <AuthCard variant="challenge">
        <h1>Card heading</h1>
      </AuthCard>
    );

    expect(cardOf()).toHaveStyle({ borderBottomColor: 'rgb(4, 5, 6)' });
    expect(cardOf()).not.toHaveStyle({ borderTopColor: 'rgb(1, 2, 3)' });
  });

  it('keeps the challenge styles off the recovery variant and off a plain card', () => {
    const { unmount } = render(
      <AuthCard variant="recovery">
        <h1>Card heading</h1>
      </AuthCard>
    );
    expect(cardOf()).not.toHaveStyle({ borderBottomColor: 'rgb(4, 5, 6)' });
    unmount();

    render(
      <AuthCard page="signIn">
        <h1>Card heading</h1>
      </AuthCard>
    );

    expect(cardOf()).not.toHaveStyle({ borderBottomColor: 'rgb(4, 5, 6)' });
  });
});
