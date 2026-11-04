import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import useConfirmFieldFocus, {
  CONFIRM_FIELD_NAME,
} from '@/modules/user/features/settings/hooks/use-confirm-field-focus';
import type {
  TwoFactorSettingsView,
  TwoFactorSettingsViewState,
} from '@/modules/user/features/settings/types/two-factor/settings-view';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

interface ProbeProps {
  readonly state: TwoFactorSettingsViewState;
}

const view = (
  fieldError: TwoFactorSettingsViewState['fieldError'],
  name: TwoFactorSettingsView = 'setup'
): TwoFactorSettingsViewState => ({
  view: name,
  fieldError,
  banner: null,
  bannerOccurrence: 0,
  statusCode: null,
});

function Probe({ state }: ProbeProps): JSX.Element {
  const { register } = useFormContext<TwoFactorDto>();
  useConfirmFieldFocus(state);
  const field = register(CONFIRM_FIELD_NAME);
  return <input aria-label="code" name={field.name} ref={field.ref} onChange={field.onChange} />;
}

function Harness({ state }: ProbeProps): JSX.Element {
  const methods = useForm<TwoFactorDto>({ defaultValues: { twoFactorCode: '' } });
  return (
    <FormProvider {...methods}>
      <Probe state={state} />
    </FormProvider>
  );
}

describe('useConfirmFieldFocus', () => {
  it('names the code field twoFactorCode', () => {
    expect(CONFIRM_FIELD_NAME).toBe('twoFactorCode');
  });

  it.each(['incomplete', 'invalid_code'] as const)(
    'focuses the field when the view carries the %s error',
    async (error) => {
      render(<Harness state={view(error)} />);

      await waitFor(() => expect(screen.getByLabelText('code')).toHaveFocus());
    }
  );

  it('leaves focus alone without a field error', async () => {
    render(<Harness state={view(null)} />);
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));

    expect(screen.getByLabelText('code')).not.toHaveFocus();
  });

  it('focuses the field again when a new view with the same error arrives', async () => {
    const { rerender } = render(<Harness state={view('invalid_code')} />);
    const input = screen.getByLabelText('code');
    await waitFor(() => expect(input).toHaveFocus());
    act(() => input.blur());
    expect(input).not.toHaveFocus();

    rerender(<Harness state={view('invalid_code')} />);

    await waitFor(() => expect(input).toHaveFocus());
  });
});
