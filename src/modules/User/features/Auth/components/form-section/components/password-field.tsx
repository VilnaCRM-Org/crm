import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { FieldValues, Path, PathValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormField from '@/modules/User/features/Auth/components/form-section/components/form-field';
import { createValidators } from '@/modules/User/features/Auth/components/form-section/validations';

import styles, { StyledEyeIcon, StyledEyeIconOff } from './styles';

type PasswordFieldProps = {
  placeholder: string;
  label: string;
  autoComplete: string;
};

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
        onMouseDown={(e) => e.preventDefault()}
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
  const toggle = (): void => setShowPassword((prev) => !prev);
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
        sx: styles.passwordField,
        endAdornment: <PasswordVisibilityButton show={showPassword} onToggle={toggle} t={t} />,
      }}
    />
  );
}
