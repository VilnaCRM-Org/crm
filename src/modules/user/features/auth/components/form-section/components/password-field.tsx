import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import type { TFunction } from 'i18next';
import { type MouseEvent, useCallback, useState } from 'react';
import { FieldValues, Path, PathValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { createValidators } from '../validations';

import FormField from './form-field';
import type { PasswordFieldProps } from './password-field.types';
import styles, { StyledEyeIcon, StyledEyeIconOff } from './styles';

function preventMouseDown(event: MouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
}

function PasswordVisibilityButton({
  show,
  onToggle,
  t,
}: {
  show: boolean;
  onToggle: () => void;
  t: TFunction;
}): JSX.Element {
  return (
    <InputAdornment position="end" sx={styles.endAdornment}>
      <IconButton
        onClick={onToggle}
        onMouseDown={preventMouseDown}
        aria-label={show ? t('auth.password.hide') : t('auth.password.show')}
        aria-pressed={show}
        edge="end"
        sx={styles.passwordButton}
      >
        {show ? <StyledEyeIconOff /> : <StyledEyeIcon />}
      </IconButton>
    </InputAdornment>
  );
}

export default function PasswordField<T extends FieldValues & { password: string }>({
  placeholder,
  label,
  autoComplete,
}: PasswordFieldProps): JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  const toggle = useCallback((): void => setShowPassword((prev) => !prev), []);
  const validators = createValidators(t);

  return (
    <FormField<T>
      rules={{
        required: t('sign_up.form.password_input.required'),
        validate: validators.password,
      }}
      defaultValue={'' as PathValue<T, Path<T>>}
      name={'password' as Path<T>}
      type={showPassword ? 'text' : 'password'}
      placeholder={placeholder}
      label={label}
      autoComplete={autoComplete}
      inputProps={{
        endAdornment: <PasswordVisibilityButton show={showPassword} onToggle={toggle} t={t} />,
      }}
    />
  );
}
