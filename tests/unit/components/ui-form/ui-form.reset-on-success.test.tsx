import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';

import UIForm from '@/components/ui-form';
import { buildNamePart } from '@tests/builders';

type Values = { name: string };

function TestField(): JSX.Element {
  const { register } = useFormContext<Values>();
  const registration = register('name');

  return (
    <input
      aria-label="name"
      ref={registration.ref}
      name={registration.name}
      onBlur={registration.onBlur}
      onChange={registration.onChange}
    />
  );
}

function mountForm(props: { initial: string; resetOnSuccess?: boolean }): jest.Mock {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(
    <UIForm<Values>
      defaultValues={{ name: props.initial }}
      onSubmit={onSubmit}
      submitLabel="Submit"
      submittingLabel="Submitting…"
      title="Title"
      resetOnSuccess={props.resetOnSuccess}
    >
      <TestField />
    </UIForm>
  );
  return onSubmit;
}

async function submitWith(onSubmit: jest.Mock, value: string): Promise<HTMLElement> {
  const input = screen.getByLabelText('name');
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: value }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());
  return input;
}

describe('UIForm resetOnSuccess', () => {
  it('keeps the submitted values on screen when reset is not requested', async () => {
    const initial = buildNamePart();
    const typed = buildNamePart();
    const onSubmit = mountForm({ initial });

    const input = await submitWith(onSubmit, typed);

    expect(input).toHaveValue(typed);
    expect(input).not.toHaveValue(initial);
  });

  it('keeps the submitted values on screen when reset is explicitly declined', async () => {
    const initial = buildNamePart();
    const typed = buildNamePart();
    const onSubmit = mountForm({ initial, resetOnSuccess: false });

    const input = await submitWith(onSubmit, typed);

    expect(input).toHaveValue(typed);
  });

  it('restores the default values after a successful submit when reset is requested', async () => {
    const initial = buildNamePart();
    const typed = buildNamePart();
    const onSubmit = mountForm({ initial, resetOnSuccess: true });

    const input = await submitWith(onSubmit, typed);

    await waitFor(() => expect(input).toHaveValue(initial));
  });
});
