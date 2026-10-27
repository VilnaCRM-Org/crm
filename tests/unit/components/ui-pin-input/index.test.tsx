import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { type Control, useForm } from 'react-hook-form';

import UIPinInput from '@/components/ui-pin-input';
import { buildTotpCode } from '@tests/builders';

interface CodeValues {
  code: string;
}

interface HarnessProps {
  defaultValue?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  onControl?: (control: Control<CodeValues>, setFocus: () => void) => void;
}

const cellLabel = (cell: number): string => `Digit ${cell} of 6`;

function Harness({
  defaultValue = '',
  helperText,
  error,
  disabled,
  onControl,
}: HarnessProps): JSX.Element {
  const { control, setFocus, watch } = useForm<CodeValues>({
    defaultValues: { code: defaultValue },
  });
  onControl?.(control, () => setFocus('code'));

  return (
    <form>
      <UIPinInput<CodeValues>
        control={control}
        name="code"
        rules={{ required: 'Required' }}
        label="Verification code"
        cellLabel={cellLabel}
        helperText={helperText}
        error={error}
        disabled={disabled}
      />
      <p aria-label="value">{watch('code')}</p>
    </form>
  );
}

const cells = (): HTMLInputElement[] => screen.getAllByRole('textbox');
const valueOutput = (): string => screen.getByLabelText('value').textContent ?? '';

describe('UIPinInput', () => {
  it('renders six controlled numeric cells in a group named by the label', () => {
    render(<Harness />);

    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument();
    expect(cells()).toHaveLength(6);
    cells().forEach((cell) => {
      expect(cell).toHaveAttribute('inputmode', 'numeric');
      expect(cell).toHaveValue('');
    });
  });

  it('puts autocomplete="one-time-code" on the first cell only', () => {
    render(<Harness />);

    const autocompletes = cells().map((cell) => cell.getAttribute('autocomplete'));

    expect(autocompletes).toEqual(['one-time-code', 'off', 'off', 'off', 'off', 'off']);
  });

  it('names each cell from the caller', () => {
    render(<Harness />);

    expect(cells().map((cell) => cell.getAttribute('aria-label'))).toEqual([
      'Digit 1 of 6',
      'Digit 2 of 6',
      'Digit 3 of 6',
      'Digit 4 of 6',
      'Digit 5 of 6',
      'Digit 6 of 6',
    ]);
  });

  it('shows the form value in the cells', () => {
    render(<Harness defaultValue="123456" />);

    expect(cells().map((cell) => cell.value)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it.each(['123 456', '123-456', '123456'])('fills six cells from the pasted text %p', (text) => {
    render(<Harness />);

    fireEvent.paste(cells()[0] as HTMLInputElement, {
      clipboardData: { getData: () => text },
    });

    expect(valueOutput()).toBe('123456');
    expect(
      cells()
        .map((cell) => cell.value)
        .join('')
    ).toBe('123456');
    expect(cells()[5]).toHaveFocus();
  });

  it('leaves the value unchanged when letters are pasted', () => {
    render(<Harness defaultValue="12" />);

    fireEvent.paste(cells()[2] as HTMLInputElement, {
      clipboardData: { getData: () => 'abc' },
    });

    expect(valueOutput()).toBe('12');
  });

  it('advances focus on a typed digit and stores it in the form', async () => {
    const user = userEvent.setup();
    const digits = buildTotpCode();
    render(<Harness />);

    await user.click(cells()[0] as HTMLInputElement);
    await user.keyboard(digits);

    expect(valueOutput()).toBe(digits);
    expect(cells()[5]).toHaveFocus();
  });

  it('keeps every cell in the natural tab order, one focused at a time', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    expect(cells()[0]).toHaveFocus();
    await user.tab();
    expect(cells()[1]).toHaveFocus();
    await user.tab({ shift: true });
    expect(cells()[0]).toHaveFocus();
    expect(cells().filter((cell) => cell.matches(':focus'))).toHaveLength(1);
    cells().forEach((cell) => expect(cell).not.toHaveAttribute('tabindex'));
  });

  it('moves between cells with the arrow keys and Backspace', async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="12" />);

    await user.click(cells()[1] as HTMLInputElement);
    await user.keyboard('{ArrowRight}');
    expect(cells()[2]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(cells()[1]).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(valueOutput()).toBe('1');
  });

  it('marks every cell invalid and describes it by one helper text', () => {
    render(<Harness error helperText="Wrong code" />);

    const helper = screen.getByText('Wrong code');
    cells().forEach((cell) => {
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell).toHaveAttribute('aria-describedby', helper.id);
    });
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    expect(screen.queryAllByRole('status')).toHaveLength(0);
    expect(screen.getAllByText('Wrong code')).toHaveLength(1);
  });

  it('shows no invalid state without an error', () => {
    render(<Harness helperText="Hint" />);

    cells().forEach((cell) => expect(cell).not.toHaveAttribute('aria-invalid'));
  });

  it('turns a failed form rule into the invalid state and its message', async () => {
    let submit = async (): Promise<void> => undefined;
    function Submitting(): JSX.Element {
      const { control, handleSubmit } = useForm<CodeValues>({ defaultValues: { code: '' } });
      submit = handleSubmit(() => undefined);
      return (
        <UIPinInput<CodeValues>
          control={control}
          name="code"
          rules={{ required: 'Enter the code' }}
          label="Verification code"
          cellLabel={cellLabel}
        />
      );
    }
    render(<Submitting />);

    await act(async () => submit());

    expect(screen.getByText('Enter the code')).toBeInTheDocument();
    cells().forEach((cell) => expect(cell).toHaveAttribute('aria-invalid', 'true'));
    expect(cells()[0]).toHaveFocus();
  });

  it('makes every cell read-only and aria-disabled when disabled', () => {
    render(<Harness disabled defaultValue="12" />);

    cells().forEach((cell) => {
      expect(cell).toHaveAttribute('readonly');
      expect(cell).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('does not change the value of a disabled field', () => {
    render(<Harness disabled defaultValue="12" />);

    fireEvent.paste(cells()[2] as HTMLInputElement, {
      clipboardData: { getData: () => '3456' },
    });

    expect(valueOutput()).toBe('12');
  });

  it('focuses the first input of the group when the form asks for focus', async () => {
    let focusCode = (): void => undefined;
    render(
      <Harness
        onControl={(_control, setFocus) => {
          focusCode = setFocus;
        }}
      />
    );
    expect(document.body).toHaveFocus();

    act(() => focusCode());

    await waitFor(() => expect(cells()[0]).toHaveFocus());
  });

  it.each([
    ['', 0],
    ['1', 1],
    ['1234', 4],
    ['12345', 5],
    ['123456', 0],
  ])('focuses the first empty cell for the value %j (cell %i)', async (value, expected) => {
    let focusCode = (): void => undefined;
    render(
      <Harness
        defaultValue={value}
        onControl={(_control, setFocus) => {
          focusCode = setFocus;
        }}
      />
    );

    act(() => focusCode());

    await waitFor(() => expect(cells()[expected]).toHaveFocus());
  });

  it('prefers the form rule message over the helper text prop', async () => {
    let submit = async (): Promise<void> => undefined;
    function Submitting(): JSX.Element {
      const { control, handleSubmit } = useForm<CodeValues>({ defaultValues: { code: '' } });
      submit = handleSubmit(() => undefined);
      return (
        <UIPinInput<CodeValues>
          control={control}
          name="code"
          rules={{ required: 'Enter the code' }}
          label="Verification code"
          cellLabel={cellLabel}
          helperText="Hint text"
        />
      );
    }
    render(<Submitting />);
    expect(screen.getByText('Hint text')).toBeInTheDocument();

    await act(async () => submit());

    expect(screen.getByText('Enter the code')).toBeInTheDocument();
    expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
  });

  it('shows empty cells for a field whose value is undefined', () => {
    function Undefined(): JSX.Element {
      const { control } = useForm<CodeValues>();
      return (
        <UIPinInput<CodeValues>
          control={control}
          name="code"
          rules={{}}
          label="Verification code"
          cellLabel={cellLabel}
        />
      );
    }
    render(<Undefined />);

    expect(cells().map((cell) => cell.value)).toEqual(['', '', '', '', '', '']);
  });

  it('unmounts without throwing and focuses again after a remount', async () => {
    let focusCode = (): void => undefined;
    const { unmount } = render(
      <Harness
        onControl={(_control, setFocus) => {
          focusCode = setFocus;
        }}
      />
    );

    expect(() => unmount()).not.toThrow();
    render(
      <Harness
        onControl={(_control, setFocus) => {
          focusCode = setFocus;
        }}
      />
    );
    act(() => focusCode());

    await waitFor(() => expect(cells()[0]).toHaveFocus());
  });
});
