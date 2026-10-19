import { styled } from '@mui/material/styles';

import { ReactComponent as EyeIconOff } from '@/assets/icons/eye-off.svg';
import { ReactComponent as EyeIcon } from '@/assets/icons/eye.svg';
import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors } from '@/styles/colors';

export default {
  endAdornment: {
    marginLeft: 0,
  },
  passwordButton: {
    minWidth: '2rem',
    minHeight: '2rem',

    marginInlineEnd: '-0.25rem',
    p: 0,

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginInlineEnd: '0.125rem',
    },

    '&:hover, &:focus-visible': {
      backgroundColor: 'transparent',
    },

    '&:focus-visible, &.Mui-focusVisible': {
      outline: `2px solid ${customColors.text.primary}`,
      outlineOffset: '2px',
    },
  },
};

export const StyledEyeIcon = styled(EyeIcon)(({ theme }) => ({
  width: '20px',
  height: '24px',
  fill: 'none',
  [theme.breakpoints.up('md')]: {
    width: '24px',
  },
}));

export const StyledEyeIconOff = styled(EyeIconOff)(({ theme }) => ({
  width: '20px',
  height: '24px',
  fill: 'none',
  [theme.breakpoints.up('md')]: {
    width: '24px',
  },
}));
