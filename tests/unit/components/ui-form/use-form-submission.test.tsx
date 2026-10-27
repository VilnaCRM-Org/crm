import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type { FormSubmission, FormSubmitProps } from '@/components/types/ui-form';
import useFormSubmission from '@/components/ui-form/use-form-submission';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import { resetClientStores } from '@tests/utils/reset-client-stores';

interface Values {
  name: string;
}

const REASON = 'Спочатку підтвердьте, що зберегли коди';

const submitProps = (overrides: Partial<FormSubmitProps> = {}): FormSubmitProps => ({
  submitLabel: 'Готово',
  submittingLabel: 'Надсилаємо',
  isSubmitDisabled: false,
  ...overrides,
});

function Provider({ children }: { children: ReactNode }): JSX.Element {
  const methods = useForm<Values>({ defaultValues: { name: '' } });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

const run = (
  submit: FormSubmitProps,
  submitting = false
): { result: { current: FormSubmission } } =>
  renderHook(() => useFormSubmission<Values>({ submit, submitting, handleSubmit: jest.fn() }), {
    wrapper: Provider,
  });

describe('useFormSubmission', () => {
  beforeEach(() => resetClientStores());

  it('enables the submit and blocks nothing by default', () => {
    const { result } = run(submitProps());

    expect(result.current.disabled).toBe(false);
    expect(result.current.block.blocked).toBe(false);
    expect(result.current.offline.online).toBe(true);
  });

  it('blocks with the reason while online and idle', () => {
    const { result } = run(submitProps({ blockedReason: REASON }));

    expect(result.current.block.blocked).toBe(true);
    expect(result.current.block.reason).toBe(REASON);
    expect(result.current.disabled).toBe(false);
  });

  it('disables natively and drops the block when isSubmitDisabled is set', () => {
    const { result } = run(submitProps({ blockedReason: REASON, isSubmitDisabled: true }));

    expect(result.current.disabled).toBe(true);
    expect(result.current.block.blocked).toBe(false);
  });

  it('drops the block while submitting without disabling the submit itself', () => {
    const { result } = run(submitProps({ blockedReason: REASON }), true);

    expect(result.current.disabled).toBe(false);
    expect(result.current.block.blocked).toBe(false);
  });

  it('disables natively and drops the block when offline', () => {
    const { result } = run(submitProps({ blockedReason: REASON }));

    act(() => useConnectivityStore.setState({ online: false }));

    expect(result.current.disabled).toBe(true);
    expect(result.current.offline.online).toBe(false);
    expect(result.current.block.blocked).toBe(false);
  });
});
