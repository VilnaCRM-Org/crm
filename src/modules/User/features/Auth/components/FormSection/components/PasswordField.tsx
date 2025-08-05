import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useState } from 'react';
import { FieldValues, Path, PathValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { validatePassword } from '@/modules/User/features/Auth/components/FormSection/Validations';

import { AuthMode } from '../types';

import FormField from './FormField';

type PasswordFieldProps = {
  mode: AuthMode;
};

export default function PasswordField<T extends FieldValues & { password: string }>({
  mode,
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
      placeholder={t('sign_up.form.password_input.placholder')}
      label={mode === 'register' ? t('sign_up.form.password_input.label') : 'Пароль'}
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
