import UiPinInput from '@vilnacrm/ui-toolkit/ui-pin-input';
import type { ReactElement } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import type { RenderFieldArgs } from '@/components/types/ui-form-input-field';
import type {
  PinFieldProps,
  PinFocusTarget,
  UIPinInputProps,
} from '@/components/types/ui-pin-input';
import pinInputSx from '@/components/ui-pin-input/styles';

const focusTargetOf = (group: HTMLElement): PinFocusTarget => ({
  focus: (): void => {
    group.querySelector('input')?.focus();
  },
});

function PinField<T extends FieldValues>({
  field,
  fieldState,
  label,
  cellLabel,
  helperText,
  error,
  disabled,
  id,
}: PinFieldProps<T>): ReactElement {
  const registerGroup = (group: HTMLElement | null): void => {
    field.ref(group === null ? null : focusTargetOf(group));
  };

  return (
    <UiPinInput
      ref={registerGroup}
      id={id}
      label={label}
      value={String(field.value ?? '')}
      onChange={field.onChange}
      cellLabel={cellLabel}
      error={error === true || fieldState.invalid}
      helperText={fieldState.error?.message ?? helperText}
      disabled={disabled}
      sx={pinInputSx}
    />
  );
}

export default function UIPinInput<T extends FieldValues>(props: UIPinInputProps<T>): ReactElement {
  const { control, name, rules, label, cellLabel, helperText, error, disabled, id } = props;
  const view = ({ field, fieldState }: RenderFieldArgs<T>): ReactElement => (
    <PinField<T>
      field={field}
      fieldState={fieldState}
      label={label}
      cellLabel={cellLabel}
      helperText={helperText}
      error={error}
      disabled={disabled}
      id={id}
    />
  );

  return <Controller name={name} control={control} rules={rules} render={view} />;
}
