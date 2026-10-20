import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import LoginForm from '@auth/components/form-section/auth-forms/login-form';

const mockUIForm = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/ui-form-field', () => ({
  __esModule: true,
  default: (): ReactElement => <input aria-label="email" />,
}));

jest.mock('@/components/ui-password-field', () => ({
  __esModule: true,
  default: (): ReactElement => <input aria-label="password" type="password" />,
}));

jest.mock('@auth/components/form-section/components/user-options', () => ({
  __esModule: true,
  default: (): ReactElement => <div />,
}));

jest.mock('@/components/ui-form', () => ({
  __esModule: true,
  default: (props: { children: ReactNode }): ReactElement => {
    mockUIForm(props);
    return <form />;
  },
}));

describe('LoginForm heading translation contract', () => {
  it('passes the sign-in title and subtitle keys to the shared form', () => {
    render(<LoginForm postLogin={{ signedIn: false, proceed: jest.fn() }} />);

    expect(mockUIForm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'sign_in.title',
        titleComponent: 'h1',
        subtitle: 'sign_in.subtitle',
      })
    );
  });

  it('never reuses the sign-in title string as the subtitle', () => {
    render(<LoginForm postLogin={{ signedIn: false, proceed: jest.fn() }} />);

    const props = mockUIForm.mock.calls[0][0] as { title: string; subtitle: string };

    expect(props.title).not.toBe(props.subtitle);
    expect(props.title).not.toBe('');
    expect(props.subtitle).not.toBe('');
  });

  it('does not leak sign-up copy into the sign-in form', () => {
    render(<LoginForm postLogin={{ signedIn: false, proceed: jest.fn() }} />);

    const props = mockUIForm.mock.calls[0][0] as { title: string; subtitle: string };

    expect(props.title.startsWith('sign_in.')).toBe(true);
    expect(props.subtitle.startsWith('sign_in.')).toBe(true);
  });
});
