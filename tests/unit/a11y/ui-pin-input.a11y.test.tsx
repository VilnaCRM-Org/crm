import { render } from '@testing-library/react';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';

import UIPinInput from '@/components/ui-pin-input';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

interface CodeValues {
  code: string;
}

interface StateProps {
  code: string;
  error?: boolean | undefined;
  helperText?: string | undefined;
  disabled?: boolean | undefined;
}

const cellLabel = (cell: number): string => `Цифра ${cell} з 6`;

function PinState({ code, error, helperText, disabled }: StateProps): JSX.Element {
  const { control } = useForm<CodeValues>({ defaultValues: { code } });

  return (
    <form aria-label="Підтвердження входу">
      <UIPinInput<CodeValues>
        control={control}
        name="code"
        rules={{}}
        label="Код підтвердження"
        cellLabel={cellLabel}
        error={error}
        helperText={helperText}
        disabled={disabled}
      />
    </form>
  );
}

describe('UIPinInput accessibility', () => {
  it.each([
    ['resting', { code: '' }],
    ['filled', { code: '123456' }],
    ['error', { code: '12', error: true, helperText: 'Невірний код. Спробуйте ще раз.' }],
    ['disabled', { code: '123456', disabled: true }],
  ] as const)('has no axe violation in the %s state', async (_state, props) => {
    const { container } = render(
      <PinState
        code={props.code}
        error={'error' in props ? props.error : undefined}
        helperText={'helperText' in props ? props.helperText : undefined}
        disabled={'disabled' in props ? props.disabled : undefined}
      />
    );

    await expectNoA11yViolations(container);
  });
});
