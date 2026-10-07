import { useTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';

import errorPageLoader from '@/components/error-boundary/error-page-loader';
import type { ErrorPageProps } from '@/components/types/error-page';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
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

  it('shares one in-flight chunk promise between calls', async () => {
    const load = jest.spyOn(ChunkRetryLoader.prototype, 'load');

    await errorPageLoader.load();
    await errorPageLoader.load();

    const [contentFirst, shellFirst, contentSecond, shellSecond] = load.mock.results.map(
      (result) => result.value
    );
    expect(load).toHaveBeenCalledTimes(4);
    expect(load.mock.contexts[2]).toBe(load.mock.contexts[0]);
    expect(load.mock.contexts[1]).not.toBe(load.mock.contexts[0]);
    expect(contentSecond).toBe(contentFirst);
    expect(shellSecond).toBe(shellFirst);
    expect(contentFirst).not.toBe(shellFirst);
    load.mockRestore();
  });
});
