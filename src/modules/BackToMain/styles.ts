import { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

const getBackToMainStyles = (theme: Theme): Record<string, SxProps<Theme>> => ({
  section: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),

    backgroundColor: theme.palette.background.default,
  },
  backButton: {
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    color: theme.palette.grey[50],
    width: '24px',
    height: '24px',
  },

  backText: {
    marginLeft: theme.spacing(1),

    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    fontSize: theme.typography.pxToRem(15),
    lineHeight: theme.typography.pxToRem(18),
    textTransform: 'none',

    color: theme.palette.grey[50],
  },
});
export default getBackToMainStyles;
