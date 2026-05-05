import type { LinkProps } from '@mui/material/Link';
import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';

import UILink from '@/components/ui-link';

const linkMock = jest.fn((props: LinkProps) => <a data-testid="mui-link">{props.children}</a>);

jest.mock('@/components/ui-link/theme', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');

  return {
    ...actual,
    Link: (props: LinkProps): JSX.Element => linkMock(props),
    ThemeProvider: ({ children }: PropsWithChildren): ReactNode => children ?? null,
  };
});

describe('UILink', () => {
  beforeEach(() => {
    linkMock.mockClear();
  });

  it('forwards standard Link props to the MUI Link component', () => {
    const handleClick = jest.fn();

    render(
      <UILink
        href="/docs"
        id="docs-link"
        className="custom-link"
        tabIndex={0}
        color="secondary"
        variant="body2"
        onClick={handleClick}
      >
        Documentation
      </UILink>
    );

    expect(linkMock).toHaveBeenCalledTimes(1);

    const [linkProps] = linkMock.mock.calls[0] as [LinkProps];

    expect(linkProps).toEqual(
      expect.objectContaining({
        href: '/docs',
        id: 'docs-link',
        className: 'custom-link',
        tabIndex: 0,
        color: 'secondary',
        variant: 'body2',
        onClick: handleClick,
      })
    );
  });
});
