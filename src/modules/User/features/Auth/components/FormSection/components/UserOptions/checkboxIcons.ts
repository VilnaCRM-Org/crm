import { styled } from '@mui/material/styles';

export const CheckBoxIcon = styled('span')(() => ({
  width: '1.25rem',
  height: '1.25rem',

  border: '1px solid #D0D4D8',
  borderRadius: '8px',
  color: '#D0D4D8',
}));

export const CheckBoxChecked = styled('span')(() => ({
  width: '1.25rem',
  height: '1.25rem',

  border: '1px solid #D0D4D8',
  borderRadius: '8px',
  backgroundColor: '#D0D4D8',

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '&::after': {
    content: '""',
    width: '0.7rem',
    height: '0.4rem',
    borderLeft: '2px solid white',
    borderBottom: '2px solid white',
    transform: 'rotate(-45deg)',
  },
}));
