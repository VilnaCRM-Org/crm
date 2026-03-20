import { act, render } from '@testing-library/react';

import useRegistrationForm from '@/modules/user/features/auth/hooks/use-registration-form';
import { registerUser, reset } from '@/modules/user/store';

type MockRegistrationState = {
  user: { email: string; fullName: string } | null;
  loading: boolean;
  error: string | null;
};

type MockRootState = {
  registration: MockRegistrationState;
};

type HookSnapshot = {
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
  view: 'form' | 'success' | 'error';
  handleRegister: (data: { email: string; fullName: string; password: string }) => void;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
};

let mockState: MockRootState = {
  registration: {
    user: null,
    loading: false,
    error: null,
  },
};

const dispatchMock = jest.fn((action: { type: string }) => {
  if (action.type === 'registration/reset') {
    mockState = {
      registration: {
        user: null,
        loading: false,
        error: null,
      },
    };
  }

  return action;
});

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/stores/hooks', () => ({
  __esModule: true,
  default: (): typeof dispatchMock => dispatchMock,
  useAppSelector: (selector: (state: MockRootState) => unknown): unknown => selector(mockState),
}));

jest.mock('@/modules/user/store', () => ({
  __esModule: true,
  registerUser: jest.fn((payload: unknown) => ({ type: 'registration/registerUser', payload })),
  reset: jest.fn(() => ({ type: 'registration/reset' })),
}));

function Capture({
  onRender,
  onViewChange,
}: {
  onRender: (snapshot: HookSnapshot) => void;
  onViewChange?: (view: 'form' | 'success' | 'error') => void;
}): JSX.Element | null {
  const result = useRegistrationForm(onViewChange);

  onRender({
    errorText: result.errorText,
    formKey: result.formKey,
    isSubmitting: result.isSubmitting,
    view: result.view,
    handleRegister: result.handleRegister,
    handleSuccessShown: result.handleSuccessShown,
    handleBackToForm: result.handleBackToForm,
    handleRetry: result.handleRetry,
  });

  return null;
}

describe('useRegistrationForm', () => {
  beforeEach(() => {
    mockState = {
      registration: {
        user: null,
        loading: false,
        error: null,
      },
    };
    dispatchMock.mockClear();
    jest.mocked(registerUser).mockClear();
    jest.mocked(reset).mockClear();
  });

  it('waits to reset the form until the success notification is shown', () => {
    const renders: HookSnapshot[] = [];
    const { rerender } = render(<Capture onRender={(snapshot) => renders.push(snapshot)} />);

    expect(renders.at(-1)).toMatchObject({
      errorText: '',
      formKey: 0,
      isSubmitting: false,
      view: 'form',
    });

    mockState = {
      registration: {
        user: {
          email: 'ada@example.com',
          fullName: 'Ada Lovelace',
        },
        loading: false,
        error: null,
      },
    };

    rerender(<Capture onRender={(snapshot) => renders.push(snapshot)} />);

    expect(renders.slice(-2)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorText: '',
          formKey: 0,
          isSubmitting: true,
          view: 'form',
        }),
        expect.objectContaining({
          errorText: '',
          formKey: 0,
          isSubmitting: false,
          view: 'success',
        }),
      ])
    );

    act(() => {
      renders.at(-1)?.handleSuccessShown();
    });

    expect(renders.at(-1)).toMatchObject({
      errorText: '',
      formKey: 1,
      isSubmitting: false,
      view: 'success',
    });

    act(() => {
      renders.at(-1)?.handleBackToForm();
    });

    expect(renders.at(-1)).toMatchObject({
      errorText: '',
      formKey: 1,
      isSubmitting: false,
      view: 'form',
    });
  });

  it('maps registration errors to the error view and notifies view changes', () => {
    const renders: HookSnapshot[] = [];
    const onViewChange = jest.fn();
    const { rerender } = render(
      <Capture onRender={(snapshot) => renders.push(snapshot)} onViewChange={onViewChange} />
    );

    mockState = {
      registration: {
        user: null,
        loading: false,
        error: 'Email already exists',
      },
    };

    rerender(<Capture onRender={(snapshot) => renders.push(snapshot)} onViewChange={onViewChange} />);

    expect(renders.at(-1)).toMatchObject({
      errorText: 'sign_up.errors.email_used',
      view: 'error',
      isSubmitting: false,
    });
    expect(onViewChange).toHaveBeenNthCalledWith(1, 'form');
    expect(onViewChange).toHaveBeenLastCalledWith('error');
  });

  it('normalizes submitted data and retries the last registration payload', () => {
    const renders: HookSnapshot[] = [];

    render(<Capture onRender={(snapshot) => renders.push(snapshot)} />);

    act(() => {
      renders.at(-1)?.handleRegister({
        email: 'ada@example.com',
        fullName: '  Ada Lovelace  ',
        password: 'Password1!',
      });
    });

    expect(jest.mocked(registerUser)).toHaveBeenCalledWith({
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      password: 'Password1!',
    });

    act(() => {
      renders.at(-1)?.handleRetry();
    });

    expect(jest.mocked(reset)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(registerUser)).toHaveBeenLastCalledWith({
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      password: 'Password1!',
    });
  });

  it('skips retry when nothing has been submitted yet', () => {
    const renders: HookSnapshot[] = [];

    render(<Capture onRender={(snapshot) => renders.push(snapshot)} />);

    act(() => {
      renders.at(-1)?.handleRetry();
    });

    expect(dispatchMock).not.toHaveBeenCalled();
    expect(jest.mocked(reset)).not.toHaveBeenCalled();
    expect(jest.mocked(registerUser)).not.toHaveBeenCalled();
  });
});
