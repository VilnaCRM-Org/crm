// @jest-environment jsdom

import '../../../../../utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';

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

const registerUserMock = jest.fn((payload: unknown) => ({
  type: 'registration/registerUser',
  payload,
}));
const resetMock = jest.fn(() => ({ type: 'registration/reset' }));

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

jest.mock('@/modules/User/store', () => ({
  __esModule: true,
  registerUser: registerUserMock,
  reset: resetMock,
}));

let useRegistrationForm!: (typeof import('@/modules/User/features/Auth/hooks/use-registration-form'))['default'];

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
  beforeAll(async () => {
    ({ default: useRegistrationForm } =
      await import('@/modules/User/features/Auth/hooks/use-registration-form'));
  });

  beforeEach(() => {
    mockState = {
      registration: {
        user: null,
        loading: false,
        error: null,
      },
    };
    dispatchMock.mockClear();
    registerUserMock.mockClear();
    resetMock.mockClear();
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

    rerender(
      <Capture onRender={(snapshot) => renders.push(snapshot)} onViewChange={onViewChange} />
    );

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

    expect(registerUserMock).toHaveBeenCalledWith({
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      password: 'Password1!',
    });

    act(() => {
      renders.at(-1)?.handleRetry();
    });

    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(registerUserMock).toHaveBeenLastCalledWith({
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
    expect(resetMock).not.toHaveBeenCalled();
    expect(registerUserMock).not.toHaveBeenCalled();
  });
});
