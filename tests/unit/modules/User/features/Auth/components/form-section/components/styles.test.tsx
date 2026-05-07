import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import breakpointsTheme from '@/components/ui-breakpoints';
import formSectionComponentStyles, {
  StyledEyeIcon,
  StyledEyeIconOff,
} from '@/modules/User/features/Auth/components/form-section/components/styles';

jest.mock('@/modules/User/features/Auth/assets/eye.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg data-testid="eye-icon" />,
}));

jest.mock('@/modules/User/features/Auth/assets/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg data-testid="eye-icon-off" />,
}));

describe('FormSection component styles', () => {
  it('keeps the expected static field and button style values', () => {
    expect(formSectionComponentStyles.formFieldWrapper).toEqual(
      expect.objectContaining({
        '&:nth-of-type(-n+2)': expect.any(Object),
      })
    );
    expect(formSectionComponentStyles.formFieldLabel).toEqual(
      expect.objectContaining({
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        marginBottom: '0.25rem',
      })
    );
    expect(formSectionComponentStyles.passwordButton).toEqual(
      expect.objectContaining({
        minWidth: '2rem',
        minHeight: '2rem',
        p: 0,
      })
    );
  });

  it('renders the styled password visibility icons with the theme', () => {
    render(
      <ThemeProvider theme={breakpointsTheme}>
        <StyledEyeIcon />
        <StyledEyeIconOff />
      </ThemeProvider>
    );

    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon-off')).toBeInTheDocument();
  });
});
