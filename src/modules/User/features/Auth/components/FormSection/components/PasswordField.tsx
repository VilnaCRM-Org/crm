import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useState } from 'react';
import { FieldValues, Path, PathValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { validatePassword } from '@/modules/User/features/Auth/components/FormSection/Validations';

// import { AuthMode } from '../types';

import FormField from './FormField';
import styles, { StyledEyeIcon, StyledEyeIconOff } from './styles';

type PasswordFieldProps = {
  // mode: AuthMode;
  placeholder: string;
  label: string;
  autoComplete: string;
};

export default function PasswordField<T extends FieldValues & { password: string }>({
  placeholder,
  label,
  autoComplete,
}: PasswordFieldProps): JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const handleClickShowPassword = (): void => setShowPassword(!showPassword);

  const passwordName = 'password' as Path<T>;
  const passwordDefaultValue = '' as PathValue<T, Path<T>>;
  return (
    <FormField<T>
      rules={{
        required: t('sign_up.form.name_input.required'),
        validate: validatePassword,
      }}
      defaultValue={passwordDefaultValue}
      name={passwordName}
      type={showPassword ? 'text' : 'password'}
      placeholder={placeholder}
      label={label}
      autoComplete={autoComplete}
      inputProps={{
        sx: styles.passwordField,
        endAdornment: (
          <InputAdornment position="end" sx={styles.endAdornment}>
            <IconButton onClick={handleClickShowPassword} edge="end" sx={styles.passwordButton}>
              {showPassword ? <StyledEyeIconOff /> : <StyledEyeIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
