import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useState } from 'react';
import { FieldValues, Path, PathValue } from 'react-hook-form';

import { validatePassword } from '@/modules/User/features/Auth/components/FormSection/Validations';

import { authForms, fieldIsRequired } from '../constants';
import { AuthMode } from '../types';

import FormField from './FormField';

type PasswordFieldProps = {
  mode: AuthMode;
};

export default function PasswordField<T extends FieldValues & { password: string }>({
  mode,
}: PasswordFieldProps): JSX.Element {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = (): void => setShowPassword(!showPassword);

  const passwordName = 'password' as Path<T>;
  const passwordDefaultValue = '' as PathValue<T, Path<T>>;

  return (
    <FormField<T>
      rules={{
        required: fieldIsRequired,
        validate: validatePassword,
      }}
      defaultValue={passwordDefaultValue}
      name={passwordName}
      type={showPassword ? 'text' : 'password'}
      placeholder="Уведіть пароль"
      label={authForms[mode].password.label}
      autoComplete="off"
      inputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? 'hide password' : 'show password'}
              onClick={handleClickShowPassword}
              edge="end"
              size="small"
            >
              {showPassword ? <VisibilityOffOutlinedIcon /> : <RemoveRedEyeOutlinedIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
