// TODO: need research why this component can be imported normally only with slash
// import UITextField from "@/components/UITextField/";
import { Grid, Checkbox, Box, Button, Divider } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useForm } from "react-hook-form"
import { Link } from 'react-router-dom';

import Theme from './Theme';

import UIFormTextField from '@/components/UIFormTextField';
import UITypography from "@/components/UITypography";
import { registerUser } from "@/modules/User/store";

export default function RegistrationForm() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      firstAndLastName: '',
      email: '',
      password: '',
    }
  });

  const registrationHandler = (data: any) => {
    console.log('registration', data);

    registerUser(data);
  }

  return (
    <ThemeProvider theme={Theme}>
      <Box
        sx={{
          width: '31.38rem',
          margin: 'auto',
          border: '1px solid #EAECEE',
          borderRadius: '16px',
          boxShadow: '0px 7px 40px 0px #E7E7E77D',
          padding: '32px 40px 40px 40px',
          marginTop: '3.4rem',
          backgroundColor: '#FFFFFF',
        }}
      >
        <form onSubmit={handleSubmit(registrationHandler)}>
          <UITypography
            variant="h4"
            sx={{
              fontSize: '30px',
              fontWeight: '600',
              marginBottom: '0.8rem',
            }}
          >
            Реєстрація
          </UITypography>
          <UITypography sx={{ marginBottom: '1.1rem' }}>Створіть аккаунт у VilnaCRM</UITypography>
          <Grid container flexDirection="column">
            <UITypography sx={{ fontSize: '0.9rem' }}>Ваше імя та прізвище</UITypography>
            <UIFormTextField
              control={control}
              rules={{ required: true }}
              defaultValue=''
              name='firstAndLastName'
              label='name and surname'
            />
          </Grid>
          <Grid container flexDirection="column">
            <UITypography>E-mail</UITypography>
            <UIFormTextField
              control={control}
              rules={{ required: true }}
              defaultValue=''
              name='email'
              label='vilnaCRM@gmail.com'
            />
          </Grid>
          <Grid container flexDirection="column">
            <UITypography>Створіть пароль</UITypography>
            <UIFormTextField
              control={control}
              rules={{ required: true }}
              defaultValue=''
              name='password'
              label='створіть пароль'
            />
          </Grid>
          <Grid container>
            <Checkbox />
            <Link to="/">
              <UITypography>Забули пароль?</UITypography>
            </Link>
          </Grid>
          <Grid>
            <Button type='submit' variant="contained">Рєєстрація</Button>
          </Grid>
          <Divider />
          <Grid>
            <Button>a</Button>
            <Button>a</Button>
            <Button>a</Button>
            <Button>a</Button>
          </Grid>
        </form>
      </Box>
      <Box>
        <Button>У вас вже є аккаунт</Button>
      </Box>
    </ThemeProvider>
  );
}
