import { useTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import footerLoader from '@/components/layouts/footer-loader';
import { paletteColors } from '@/styles/colors';

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: function FooterStub(): JSX.Element {
    return <footer>{useTheme().palette.primary.main}</footer>;
  },
}));

describe('footerLoader', () => {
  it('loads the footer chunk wrapped in the application theme', async () => {
    const { default: Footer } = await footerLoader.load();
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent(paletteColors.primary.main);
  });
});
