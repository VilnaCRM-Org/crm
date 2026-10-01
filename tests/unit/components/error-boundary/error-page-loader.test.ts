import { useTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';

import errorPageLoader from '@/components/error-boundary/error-page-loader';
import type { ErrorPageProps } from '@/components/types/error-page';
import { paletteColors } from '@/styles/colors';

jest.mock('@/components/error-page', () => ({
  __esModule: true,
  default: function ErrorPageStub({ variant, landmark }: ErrorPageProps): ReactElement {
    return createElement('h1', null, `${variant} ${landmark} ${useTheme().palette.primary.main}`);
  },
}));

describe('errorPageLoader', () => {
  it('loads the error-page chunk themed and forwards variant and landmark', async () => {
    const { default: ThemedErrorPage } = await errorPageLoader.load();
    render(createElement(ThemedErrorPage, { variant: 'forbidden', landmark: 'region' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `forbidden region ${paletteColors.primary.main}`
    );
  });

  it('shares one loaded module between calls', async () => {
    const first = await errorPageLoader.load();
    const second = await errorPageLoader.load();

    render(createElement(second.default, { variant: 'serverError', landmark: 'main' }));

    expect(typeof first.default).toBe('function');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `serverError main ${paletteColors.primary.main}`
    );
  });
});
