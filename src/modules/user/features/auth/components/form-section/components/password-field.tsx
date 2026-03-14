import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useState } from 'react';
import { FieldValues, Path, PathValue, RegisterOptions } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormField from '@/modules/user/features/auth/components/form-section/components/form-field';
import styles, {
  StyledEyeIcon,
  StyledEyeIconOff,
} from '@/modules/user/features/auth/components/form-section/components/styles';
import { buildPasswordRules } from '@/modules/user/features/auth/components/form-section/validations';

type PasswordFieldProps<T extends FieldValues> = {
  placeholder: string;
  label: string;
  autoComplete: string;
  rules?: RegisterOptions<T>;
};

export default function PasswordField<T extends FieldValues & { password: string }>({
  placeholder,
  label,
  autoComplete,
  rules,
}: PasswordFieldProps<T>): JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const handleClickShowPassword = (): void => setShowPassword((prev) => !prev);

  const passwordName = 'password' as Path<T>;
  const passwordDefaultValue = '' as PathValue<T, Path<T>>;
  const defaultRules: RegisterOptions<T> = buildPasswordRules<T>(t);
  const mergedRules: RegisterOptions<T> = { ...defaultRules, ...rules } as RegisterOptions<T>;

  return (
    <FormField<T>
      rules={mergedRules}
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
            <IconButton
              onClick={handleClickShowPassword}
              onMouseDown={(e) => e.preventDefault()}
              aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
              aria-pressed={showPassword}
              edge="end"
              sx={styles.passwordButton}
            >
              {showPassword ? <StyledEyeIconOff /> : <StyledEyeIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
