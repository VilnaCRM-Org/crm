import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';

import UIPinInput from '@/components/ui-pin-input';

interface CodeValues {
  code: string;
}

const cellLabel = (cell: number): string => `Digit ${cell} of 6`;

function Harness(): JSX.Element {
  const { control, formState } = useForm<CodeValues>({
    defaultValues: { code: '' },
    mode: 'onTouched',
  });

  return (
    <form>
      <UIPinInput<CodeValues>
        control={control}
        name="code"
        rules={{ required: 'Enter the code' }}
        label="Verification code"
        cellLabel={cellLabel}
      />
      <button type="button">After</button>
      <output aria-label="touched">{formState.touchedFields.code ? 'touched' : 'untouched'}</output>
    </form>
  );
}

const cells = (): HTMLInputElement[] => screen.getAllByRole('textbox');
const cell = (index: number): HTMLInputElement => cells()[index] as HTMLInputElement;
const touched = (): string => screen.getByLabelText('touched').textContent ?? '';

describe('UIPinInput blur', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not touch the field while focus moves between its cells', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(cell(0));
    await user.keyboard('123');
    await user.tab();
    await user.tab({ shift: true });

    expect(touched()).toBe('untouched');
    expect(screen.queryByText('Enter the code')).not.toBeInTheDocument();
    cells().forEach((item) => expect(item).not.toHaveAttribute('aria-invalid'));
  });

  it('touches the field and validates it once focus leaves the whole group', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(cell(5));
    await user.tab();

    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(touched()).toBe('touched');
    expect(screen.getByText('Enter the code')).toBeInTheDocument();
    cells().forEach((item) => expect(item).toHaveAttribute('aria-invalid', 'true'));
    expect(cell(0)).toHaveAccessibleDescription('Enter the code');
  });

  it('touches the field when focus leaves to nowhere inside a focused document', async () => {
    render(<Harness />);
    jest.spyOn(document, 'hasFocus').mockReturnValue(true);

    fireEvent.focusOut(cell(2), { relatedTarget: null });

    await waitFor(() => expect(touched()).toBe('touched'));
  });

  it('does not touch the field when the whole window loses focus', () => {
    render(<Harness />);
    jest.spyOn(document, 'hasFocus').mockReturnValue(false);

    fireEvent.focusOut(cell(2), { relatedTarget: null });

    expect(touched()).toBe('untouched');
  });

  it('adds no second group and no tab stop around the cells', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();

    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(cell(0)).toHaveFocus();
  });
});
