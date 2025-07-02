// TODO: need research why this component can be imported normally only with slash
// import UITextField from "@/components/UITextField/";
import UIButton from '@/components/UIButton';
import UIFormTextField from '@/components/UIFormTextField';
import UITypography from '@/components/UITypography';
import useAppDispatch from '@/hooks';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Grid, Box, Divider } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { ThemeProvider } from '@mui/material/styles';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import RegisterUserDto from '@/modules/User/features/Auth/types/Credentials';
import { registerUser } from '@/modules/User/store';

import { ReactComponent as Facebook } from '../../assets/facebookColor.svg';
import { ReactComponent as Github } from '../../assets/github.svg';
import { ReactComponent as Google } from '../../assets/GoogleColor.svg';
import { ReactComponent as Twitter } from '../../assets/twitterColor.svg';

import Theme from './Theme';

export default function RegistrationForm(): JSX.Element {
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
    <ThemeProvider theme={Theme}>
      <Box sx={{ flex: '1' }}>
        <Box
          sx={{
            width: '31.38rem',
            margin: 'auto',
            border: '1px solid #EAECEE',
            borderRadius: '16px',
            boxShadow: '0px 7px 40px 0px #E7E7E77D',
            padding: '32px 39px 31px 39px',
            marginTop: '3.4rem',
            backgroundColor: '#FFFFFF',
            '@media (max-width: 1024px)': {
              width: '39.5rem',
              marginTop: '8.4rem',
              padding: '40px 46px 31px 46px',
            },
            '@media (max-width: 375px)': {
              width: '22.6875rem',
              marginTop: '0',
              padding: '23px 23px 16px 23px',
            },
          }}
        >
          {error ? <UITypography sx={{ color: 'red' }}>{error}</UITypography> : null}
          <form onSubmit={handleSubmit(registrationHandler)}>
            <UITypography
              variant="h4"
              sx={{
                fontSize: '30px',
                fontWeight: '600',
                marginBottom: '0.8rem',
                '@media (max-width: 375px)': {
                  fontSize: '1.375rem',
                  marginBottom: '0.4rem',
                },
              }}
            >
              Реєстрація
            </UITypography>
            <UITypography
              sx={{
                marginBottom: '1.1rem',
                letterSpacing: '0.68px',
                '@media (max-width: 375px)': {
                  letterSpacing: '0.18px',
                  marginBottom: '0.82rem',
                },
              }}
            >
              Створіть аккаунт у VilnaCRM
            </UITypography>
            <Grid container flexDirection="column">
              <UITypography
                sx={{
                  fontSize: '0.88rem',
                  marginTop: '3px',
                  marginBottom: '8px',
                  letterSpacing: '0.1px',
                  fontFamily: 'Inter',
                  '@media (max-width: 1024px)': {
                    letterSpacing: '1.1px',
                  },
                  '@media (max-width: 375px)': {
                    marginBottom: '2px',
                  },
                }}
              >
                Ваше імя та прізвище
              </UITypography>
              <UIFormTextField
                control={control}
                rules={{ required: true }}
                defaultValue=""
                name="fullName"
                placeholder="Михайло Светський"
                type="text"
              />
            </Grid>
            <Grid container flexDirection="column">
              <UITypography
                sx={{
                  fontSize: '0.88rem',
                  marginTop: '14.5px',
                  marginBottom: '7px',
                  letterSpacing: '0.1px',
                  '@media (max-width: 1024px)': {
                    marginTop: '13.5px',
                    fontSize: '1rem',
                    color: '#404142',
                  },
                  '@media (max-width: 375px)': {
                    marginTop: '5.5px',
                    marginBottom: '2px',
                  },
                }}
              >
                E-mail
              </UITypography>
              <UIFormTextField
                control={control}
                rules={{ required: true }}
                defaultValue=""
                name="email"
                placeholder="vilnaCRM@gmail.com"
                type="email"
              />
            </Grid>
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
              <UITypography
                sx={{
                  fontSize: '0.88rem',
                  marginTop: '13.5px',
                  marginBottom: '8px',
                  letterSpacing: '0.1px',
                  '@media (max-width: 1024px)': {
                    fontSize: '1rem',
                    marginTop: '12.5px',
                  },
                  '@media (max-width: 375px)': {
                    marginTop: '5.5px',
                    marginBottom: '2px',
                  },
                }}
              >
                Пароль
              </UITypography>
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
            <Divider
              sx={{
                marginTop: '13px',
                marginBottom: '25px',
                textTransform: 'uppercase',
                lineHeight: '18px',
                fontSize: '14px',
                '@media (max-width: 1024px)': {
                  fontSize: '1.125rem',
                  marginTop: '23px',
                  marginBottom: '18px',
                },
                '@media (max-width: 375px)': {
                  marginTop: '17px',
                  marginBottom: '14px',
                },
              }}
            >
              Або
            </Divider>
            <Grid container justifyContent="space-between">
              <UIButton variant="outlined">
                <Google />
              </UIButton>
              <UIButton variant="outlined">
                <Facebook />
              </UIButton>
              <UIButton variant="outlined">
                <Github />
              </UIButton>
              <UIButton variant="outlined">
                <Twitter />
              </UIButton>
            </Grid>
          </form>
        </Box>
        <Box>
          <Grid
            container
            justifyContent="center"
            sx={{
              marginTop: '21px',
              marginBottom: '48px',
              '@media (max-width: 1024px)': {
                marginTop: '43px',
              },
              '@media (max-width: 375px)': {
                marginTop: '17px',
                marginBottom: '18px',
              },
            }}
          >
            <UIButton
              sx={{
                fontSize: '13px',
                lineHeight: '18px',
                color: '#969B9D',
                textTransform: 'none',
                letterSpacing: '1px',
                '@media (max-width: 1024px)': {
                  fontSize: '1.125rem',
                  letterSpacing: '0',
                },
              }}
            >
              У вас вже є аккаунт?
            </UIButton>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
