import UIButton from '@/components/UIButton';
import UITypography from '@/components/UITypography';
import useAppDispatch from '@/hooks';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import AuthOptions from '@/modules/User/features/Auth/components/FormSection/AuthOptions';
import FormField from '@/modules/User/features/Auth/components/FormSection/Form/FormField';
import RegisterUserDto from '@/modules/User/features/Auth/types/Credentials';
import { registerUser } from '@/modules/User/store';

import authForms from './constants/AuthForms';
import styles from './styles';
import { validateEmail, validateFullName, validatePassword } from './Validations';

const fieldIsRequired = "Це поле обов'язкове";

export default function Form({ isLoginMode }: { isLoginMode: boolean }): JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const handleClickShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  const dispatch = useAppDispatch();

  const { handleSubmit, control } = useForm<RegisterUserDto>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const registrationHandler = async (data: RegisterUserDto): Promise<void> => {
    const resultAction = await dispatch(registerUser(data));

    if (registerUser.rejected.match(resultAction)) {
      const message = resultAction.payload || 'Unknown error';
      setError(`Registration failed: ${message}`);
    }
  };
  const modeKey = isLoginMode ? 'authentication' : 'registration';
  return (
    <form onSubmit={handleSubmit(registrationHandler)}>
      {error ? <UITypography sx={{ color: 'red' }}>{error}</UITypography> : null}
      <UITypography variant="h4" sx={styles.formTitle}>
        {authForms[modeKey].title}
      </UITypography>

      <UITypography sx={styles.formIntoText}> {authForms[modeKey].infoText}</UITypography>

      {!isLoginMode ? (
        <FormField<RegisterUserDto>
          control={control}
          rules={{
            required: fieldIsRequired,
            validate: validateFullName,
          }}
          defaultValue="Михайло Светський"
          name="fullName"
          placeholder="Михайло Светський"
          type="text"
          label="Ваше імя та прізвище"
          autoComplete="off"
        />
      ) : null}

      <FormField<RegisterUserDto>
        control={control}
        rules={{
          required: fieldIsRequired,
          validate: validateEmail,
        }}
        defaultValue=""
        name="email"
        placeholder="vilnaCRM@gmail.com"
        type="email"
        label="E-mail"
        autoComplete="off"
      />

      <FormField<RegisterUserDto>
        control={control}
        rules={{
          required: fieldIsRequired,
          validate: validatePassword,
        }}
        defaultValue=""
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Уведіть пароль"
        label={authForms[modeKey].password.label}
        autoComplete="off"
        inputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
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
      <AuthOptions />

      <UIButton sx={styles.submitButton} type="submit" variant="contained">
        {authForms[modeKey].submitButton}
      </UIButton>
    </form>
  );
}
