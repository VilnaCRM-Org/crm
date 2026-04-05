import { hasSuccessfulSignupBody } from '../../load/signup/response-assertions';

describe('hasSuccessfulSignupBody', () => {
  it('accepts the current mock fixture response in mock mode', () => {
    expect(
      hasSuccessfulSignupBody(
        {
          id: '',
          email: '',
        },
        'test.123@example.com',
        false
      )
    ).toBe(true);
  });

  it('keeps the stricter email and id assertions for the real backend', () => {
    expect(
      hasSuccessfulSignupBody(
        {
          id: 'user-123',
          email: 'test.123@example.com',
        },
        'test.123@example.com',
        true
      )
    ).toBe(true);

    expect(
      hasSuccessfulSignupBody(
        {
          id: '',
          email: '',
        },
        'test.123@example.com',
        true
      )
    ).toBe(false);
  });

  it('rejects empty id even when email matches for real backend', () => {
    expect(
      hasSuccessfulSignupBody(
        {
          id: '',
          email: 'test.123@example.com',
        },
        'test.123@example.com',
        true
      )
    ).toBe(false);
  });
});
