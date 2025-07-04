import UIButton from '@/components/UIButton';
import UIFormTextField from '@/components/UIFormTextField';
import UITypography from '@/components/UITypography';
import useAppDispatch from '@/hooks';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Grid } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import FormField from '@/modules/User/features/Auth/components/FormSection/Form/FormField';
import RegisterUserDto from '@/modules/User/features/Auth/types/Credentials';
import { registerUser } from '@/modules/User/store';

import Styles from './styles';

export default function Form(): JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const handleClickShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
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

  return (
    <form onSubmit={handleSubmit(registrationHandler)}>
      {error ? <UITypography sx={{ color: 'red' }}>{error}</UITypography> : null}
      <UITypography variant="h4" sx={Styles.formTitle}>
        {' '}
        Реєстрація{' '}
      </UITypography>

      <UITypography sx={Styles.formIntoText}>Створіть аккаунт у VilnaCRM</UITypography>

      <FormField<RegisterUserDto>
        control={control}
        rules={{ required: true }}
        defaultValue=""
        name="fullName"
        placeholder="Михайло Светський"
        type="text"
        label="Ваше імя та прізвище"
      />
      <FormField<RegisterUserDto>
        control={control}
        rules={{ required: true }}
        defaultValue=""
        name="email"
        placeholder="vilnaCRM@gmail.com"
        type="email"
        label="E-mail"
      />

      <Grid
        container
        flexDirection="column"
        sx={{
          marginBottom: '18px',
          '@media (max-width: 1024px)': {
            marginBottom: '32px',
          },
          '@media (max-width: 375px)': {
            marginBottom: '14px',
          },
        }}
      >
        <UITypography sx={Styles.formFieldLabel}>Пароль</UITypography>
        <UIFormTextField
          control={control}
          rules={{ required: true }}
          defaultValue=""
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Створіть пароль"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{}}>
                <IconButton
                  sx={{ paddingRight: '18px' }}
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid>
        <UIButton
          sx={{
            width: '100%',
            boxShadow: 'none',
            fontWeight: '600',
            marginTop: '2px',
            padding: '15px 32px',
            fontSize: '18px',
            textTransform: 'none',
            letterSpacing: '0',
            '@media (max-width: 1024px)': {
              padding: '19px 32px',
              fontWeight: '500',
            },
            '@media (max-width: 375px)': {
              padding: '9px 32px',
            },
          }}
          type="submit"
          variant="contained"
        >
          Реєстрація
        </UIButton>
      </Grid>
    </form>
  );
}
