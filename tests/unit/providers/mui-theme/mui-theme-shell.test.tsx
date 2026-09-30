import { useTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import MuiThemeShell from '@/providers/mui-theme/mui-theme-shell';
import { paletteColors } from '@/styles/colors';

function PrimaryColor(): JSX.Element {
  return <span>{useTheme().palette.primary.main}</span>;
}

describe('MuiThemeShell', () => {
  it('provides the application theme, not the MUI default, to its children', () => {
    render(
      <MuiThemeShell>
        <PrimaryColor />
      </MuiThemeShell>
    );

    expect(screen.getByText(paletteColors.primary.main)).toBeInTheDocument();
  });
});
