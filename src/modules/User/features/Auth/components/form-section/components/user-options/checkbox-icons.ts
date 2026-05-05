import { customColors } from '@/styles/colors';
import { styled } from '@mui/material/styles';

export const CheckBoxIcon = styled('span')(() => ({
  width: '1.25rem',
  height: '1.25rem',

  border: `1px solid ${customColors.checkbox.main}`,
  borderRadius: '8px',
  color: customColors.checkbox.main,
}));

export const CheckBoxChecked = styled('span')(() => ({
  width: '1.25rem',
  height: '1.25rem',

  border: `1px solid ${customColors.checkbox.main}`,
  borderRadius: '8px',
  backgroundColor: customColors.checkbox.main,

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '&::after': {
    content: '""',
    width: '0.7rem',
    height: '0.5rem',
    borderLeft: '3px solid white',
    borderBottom: '3px solid white',
    transform: 'rotate(-45deg)',
  },
}));
