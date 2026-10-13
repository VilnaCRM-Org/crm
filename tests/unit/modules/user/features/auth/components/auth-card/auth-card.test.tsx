import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import AuthCard from '@auth/components/auth-card';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const cardOf = (): HTMLElement => {
  const card = screen.getAllByRole('generic').find((element) => element.id === 'auth-form-card');
  if (!card) throw new Error('No #auth-form-card was rendered');
  return card;
};

describe('AuthCard', () => {
  it('renders the children in the card and after as the last child of the section', () => {
    render(
      <AuthCard after={<p>after the card</p>}>
        <h1>Card heading</h1>
      </AuthCard>
    );

    const card = cardOf();
    const after = screen.getByText('after the card');
    expect(card).toContainElement(screen.getByRole('heading', { name: 'Card heading' }));
    expect(card).not.toContainElement(after);
    expect(card.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders nothing after the card without after', () => {
    render(
      <AuthCard>
        <h1>Card heading</h1>
      </AuthCard>
    );

    expect(document.body).toHaveTextContent(/^Card heading$/);
    expect(cardOf()).toHaveTextContent(/^Card heading$/);
  });

  it('has no axe violations with a heading and a form', async () => {
    const { container } = render(
      <main>
        <AuthCard>
          <h1>Card heading</h1>
          <form aria-label="Recovery">
            <label htmlFor="email">Email</label>
            <input id="email" />
          </form>
        </AuthCard>
      </main>
    );

    await expectNoA11yViolations(container);
  });
});
