import { act, renderHook, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import useChallengeFieldSync, { CODE_FIELD_NAME } from '@auth/hooks/use-challenge-field-sync';
import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';

const RESTING: TwoFactorChallengeState = {
  mode: 'totp',
  value: '',
  fieldError: null,
  banner: null,
  focusRequest: 0,
  isSubmitting: false,
};

interface Harness {
  readonly form: UseFormReturn<TwoFactorDto>;
  readonly focus: jest.Mock;
}

const mount = (
  initial: TwoFactorChallengeState,
  typed = ''
): {
  rerender: (state: TwoFactorChallengeState) => void;
  harness: () => Harness;
} => {
  const focus = jest.fn();
  let form!: UseFormReturn<TwoFactorDto>;
  let state = initial;
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    form = useForm<TwoFactorDto>({ defaultValues: { twoFactorCode: typed } });
    form.setFocus = focus;
    return <FormProvider {...form}>{children}</FormProvider>;
  }
  const view = renderHook(() => useChallengeFieldSync(state), { wrapper: Wrapper });
  return {
    rerender: (next: TwoFactorChallengeState): void => {
      state = next;
      view.rerender();
    },
    harness: () => ({ form, focus }),
  };
};

describe('useChallengeFieldSync', () => {
  it('names the field twoFactorCode', () => {
    expect(CODE_FIELD_NAME).toBe('twoFactorCode');
  });

  it('clears a stored code when the hook value is empty', async () => {
    const { harness } = mount(RESTING, '123456');

    await waitFor(() => expect(harness().form.getValues('twoFactorCode')).toBe(''));
  });

  it('leaves a stored code alone while the hook value is not empty', async () => {
    const { harness } = mount({ ...RESTING, value: '12' }, '12');

    await act(async () => Promise.resolve());

    expect(harness().form.getValues('twoFactorCode')).toBe('12');
  });

  it('clears again on a new focus request even though the value stayed empty', async () => {
    const { rerender, harness } = mount(RESTING);
    harness().form.setValue('twoFactorCode', '654321');

    rerender({ ...RESTING, focusRequest: 1 });

    await waitFor(() => expect(harness().form.getValues('twoFactorCode')).toBe(''));
  });

  it('asks for focus only once a focus is requested, and again for each request', async () => {
    const { rerender, harness } = mount(RESTING);
    await act(async () => Promise.resolve());
    expect(harness().focus).not.toHaveBeenCalled();

    rerender({ ...RESTING, focusRequest: 1 });
    rerender({ ...RESTING, focusRequest: 2 });

    await waitFor(() => expect(harness().focus).toHaveBeenCalledTimes(2));
    expect(harness().focus).toHaveBeenCalledWith('twoFactorCode');
  });
});
