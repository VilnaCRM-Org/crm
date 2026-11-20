import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';

import type { FieldRules } from '@/components/types/ui-form-input-field';
import UIPinInput from '@/components/ui-pin-input';

interface CodeValues {
  code: string;
}

const cellLabel = (cell: number): string => `Digit ${cell} of 6`;

function Harness({ rules }: { rules: FieldRules<CodeValues> }): JSX.Element {
  const { control } = useForm<CodeValues>();

  return (
    <form>
      <UIPinInput<CodeValues>
        control={control}
        name="code"
        rules={rules}
        label="Verification code"
        cellLabel={cellLabel}
      />
    </form>
  );
}

const cells = (): HTMLInputElement[] => screen.getAllByRole('textbox');

const expectRequiredOnFirstCellOnly = (): void => {
  const [first, ...rest] = cells();
  expect(first).toBeRequired();
  rest.forEach((cell) => expect(cell).not.toBeRequired());
};

const expectNoRequiredCell = (): void => {
  cells().forEach((cell) => expect(cell).not.toBeRequired());
};

describe('UIPinInput required state', () => {
  it('announces a field whose rule is a message as required on the first cell', () => {
    render(<Harness rules={{ required: 'Enter the code' }} />);

    expectRequiredOnFirstCellOnly();
  });

  it('announces a field whose rule is true as required', () => {
    render(<Harness rules={{ required: true }} />);

    expectRequiredOnFirstCellOnly();
  });

  it('announces a field whose rule object holds true as required', () => {
    render(<Harness rules={{ required: { value: true, message: 'Enter the code' } }} />);

    expectRequiredOnFirstCellOnly();
  });

  it('does not announce a field whose rule object holds false', () => {
    render(<Harness rules={{ required: { value: false, message: 'Enter the code' } }} />);

    expectNoRequiredCell();
  });

  it('does not announce a field whose rule is false', () => {
    render(<Harness rules={{ required: false }} />);

    expectNoRequiredCell();
  });

  it('does not announce a field with no required rule', () => {
    render(<Harness rules={{}} />);

    expectNoRequiredCell();
  });

  it('renders empty cells for a field the form gave no default value', () => {
    render(<Harness rules={{}} />);

    cells().forEach((cell) => expect(cell).toHaveValue(''));
  });
});
