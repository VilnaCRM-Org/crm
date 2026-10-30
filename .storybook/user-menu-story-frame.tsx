import Box from '@mui/material/Box';
import type { Decorator } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import type { ShellLayout } from '../src/components/types/ui-app-shell';
import userMenuStyles from '../src/modules/user/features/settings/components/user-menu/styles';

interface UserMenuFrameArgs {
  readonly layout?: ShellLayout | undefined;
}

export const withUserMenuPadding: Decorator = function UserMenuPaddingDecorator(
  Story
): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '24px 72px 24px 24px',
        minHeight: 280,
      }}
    >
      <Story />
    </div>
  );
};

export const withUserMenuFrame: Decorator = function UserMenuFrameDecorator(
  Story,
  { args }
): JSX.Element {
  const { layout = 'desktop' }: UserMenuFrameArgs = args;

  return (
    <Box sx={userMenuStyles.root[layout]}>
      <Story />
    </Box>
  );
};
