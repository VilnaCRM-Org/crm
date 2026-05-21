import { SxProps, Theme } from '@mui/material';

type BaseTypographyProps = {
  sx?: SxProps<Theme>;
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'medium16'
    | 'medium15'
    | 'medium14'
    | 'regular16'
    | 'bodyText18'
    | 'bodyText16'
    | 'bold22'
    | 'demi18'
    | 'button'
    | 'mobileText';
  children: React.ReactNode;
  id?: string;
  role?: React.AriaRole;
};

type LabelTypographyProps = {
  component: 'label';
  htmlFor: string;
};

type NonLabelTypographyProps = {
  component?: 'section' | 'p' | 'div' | 'span' | 'a' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  htmlFor?: never;
};

export type UiTypographyProps = BaseTypographyProps &
  (LabelTypographyProps | NonLabelTypographyProps);
