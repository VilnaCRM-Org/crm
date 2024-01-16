import { createTheme } from '@mui/material';

export default createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#969B9D',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: '1px solid #969B9D',
          },
          '&.Mui-disabled': {
            backgroundColor: '#E1E7EA',
            color: '#969B9D',
          },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderWidth: 0,
          }
        },
        notchedOutline: {
          border: '1px solid #D0D4D8',
          borderRadius: '8px',
          '&:hover': {
            borderColor: '#969B9D',
          }
        },
        input: {
          padding: '20.5px 28px',
          letterSpacing: '0.4px',
          '@media (max-width: 1024px)': {
            fontSize: '1.125rem',
            padding: '26.8px 28px',
          },
          '@media (max-width: 375px)': {
            padding: '14.5px 21px',
            fontSize: '0.875rem',
          }
        }
      }
    }
  }
});
