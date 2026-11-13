import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import type { JSX, ReactNode } from 'react';
import * as ReactHookForm from 'react-hook-form';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import useChallengeAutoSubmit from '@auth/hooks/use-challenge-auto-submit';
import { buildTotpCode } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const mount = (
  initial = '',
  useHook: typeof useChallengeAutoSubmit = useChallengeAutoSubmit
): { form: () => UseFormReturn<TwoFactorDto>; onComplete: jest.Mock; rerender: () => void } => {
  const onComplete = jest.fn();
  let form: UseFormReturn<TwoFactorDto> | undefined;
  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => {
    const methods = useForm<TwoFactorDto>({ defaultValues: { twoFactorCode: initial } });
    form = methods;
    return <FormProvider {...methods}>{children}</FormProvider>;
  };
  const { rerender } = renderHook(() => useHook(onComplete), {
    wrapper: Wrapper,
  });

  return { form: () => form as UseFormReturn<TwoFactorDto>, onComplete, rerender };
};

const enter = (form: UseFormReturn<TwoFactorDto>, value: string): void => {
  act(() => form.setValue('twoFactorCode', value));
};

describe('useChallengeAutoSubmit', () => {
  it('submits once when the value reaches six digits', () => {
    const { form, onComplete, rerender } = mount();

    enter(form(), '12345');
    expect(onComplete).not.toHaveBeenCalled();

    enter(form(), '123456');
    expect(onComplete).toHaveBeenCalledTimes(1);

    rerender();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('submits a pasted code that arrives all at once', () => {
    const { form, onComplete } = mount();

    enter(form(), '654321');

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not submit a complete value that was already there on mount', () => {
    const { onComplete } = mount('123456');

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('submits again only after the code is edited and completed again', () => {
    const { form, onComplete } = mount();
    enter(form(), '123456');

    enter(form(), '12345');
    expect(onComplete).toHaveBeenCalledTimes(1);

    enter(form(), '123457');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it.each(['12345a', '1234567', ' 12345', '12345\n'])('ignores %j', (value) => {
    const { form, onComplete } = mount();

    enter(form(), value);

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe('useChallengeAutoSubmit pattern loaded inside the test', () => {
  const loadHook = (): Promise<typeof useChallengeAutoSubmit> =>
    loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-hook-form', () => ReactHookForm);
      return (await import('@auth/hooks/use-challenge-auto-submit')).default;
    });

  it.each([buildTotpCode(), '000000', '999999'])('submits the complete code %s', async (code) => {
    const { form, onComplete } = mount('', await loadHook());

    enter(form(), code);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it.each([
    '',
    '1',
    '12345',
    '1234567',
    '12345a',
    'a12345',
    ' 123456',
    '123456 ',
    '123456\n',
    '\n123456',
    '12345\n6',
    '١٢٣٤٥٦',
  ])('does not submit %j', async (value) => {
    const { form, onComplete } = mount('x', await loadHook());

    enter(form(), value);

    expect(onComplete).not.toHaveBeenCalled();
  });
});
