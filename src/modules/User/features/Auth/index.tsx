import UIFooter from '@/components/UIFooter';
import Theme from '@/styles/theme';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Grid, Typography, Box, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { Link } from 'react-router-dom';

import RegistrationForm from '@/modules/User/features/Auth/components/RegistrationForm';

export default function Authentication(): React.ReactElement {
  return (
    <ThemeProvider theme={Theme}>
      <Box
        sx={{
          backgroundColor: '#FBFBFB',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ backgroundColor: '#FFFFFF', height: '4rem' }}>
          <Grid
            container
            flexDirection="row"
            justifyContent="center"
            sx={{
              height: '100%',
              width: '11.5rem',
              backgroundColor: '#FFFFFF',
              marginLeft: '8rem',
            }}
          >
            <Button sx={{ padding: '0' }}>
              <Link to="/">
                <Grid container flexDirection="row" justifyContent="center">
                  <ArrowBackIosIcon sx={{ color: '#969B9D' }} />
                  <Typography
                    sx={{
                      fontSize: '14.5px',
                      fontWeight: '500',
                      letterSpacing: '0.3px',
                      textTransform: 'none',
                      paddingTop: '2px',
                      color: '#969B9D',
                    }}
                  >
                    На головну сторінку
                  </Typography>
                </Grid>
              </Link>
            </Button>
          </Grid>
        </Box>
        <RegistrationForm />
        <UIFooter />
      </Box>
    </ThemeProvider>
  );
}
