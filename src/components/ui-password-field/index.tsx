import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { type JSX, type MouseEvent, useCallback, useState } from 'react';
import { FieldValues, Path, PathValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type {
  PasswordFieldProps,
  PasswordVisibilityButtonProps,
} from '@/components/types/ui-password-field';
import UIFormField from '@/components/ui-form-field';

import styles, { StyledEyeIcon, StyledEyeIconOff } from './styles';

function preventMouseDown(event: MouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
}

function PasswordVisibilityButton({
  show,
  onToggle,
  t,
}: PasswordVisibilityButtonProps): JSX.Element {
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

export default function UIPasswordField<T extends FieldValues>({
  placeholder,
  label,
  autoComplete,
  name = 'password' as Path<T>,
  rules,
  describedBy,
  readOnly,
  sx,
}: PasswordFieldProps<T>): JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
  const toggle = useCallback((): void => setShowPassword((prev) => !prev), []);

  return (
    <UIFormField<T>
      rules={rules}
      defaultValue={'' as PathValue<T, Path<T>>}
      name={name}
      describedBy={describedBy}
      sx={sx}
      type={showPassword ? 'text' : 'password'}
      placeholder={placeholder}
      label={label}
      autoComplete={autoComplete}
      inputProps={{
        endAdornment: <PasswordVisibilityButton show={showPassword} onToggle={toggle} t={t} />,
        readOnly,
      }}
    />
  );
}
