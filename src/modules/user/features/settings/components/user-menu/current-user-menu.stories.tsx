import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useCallback, useState } from 'react';

import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';
import { loadedProfile, withProfileProvider } from '@stories/profile-provider-decorators';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import type { CurrentUserMenuProps } from '../../types/components/user-menu';

import CurrentUserMenu from './current-user-menu';

import UserMenu from '.';

function ReadingMenu({ onIdentity }: CurrentUserMenuProps): JSX.Element {
  const [identity, setIdentity] = useState<UserDisplayName | null>(null);
  const report = useCallback(
    (next: UserDisplayName | null): void => {
      setIdentity(next);
      onIdentity(next);
    },
    [onIdentity]
  );

  return (
    <>
      <UserMenu identity={identity} settingsAvailable signOut={noop} />
      <CurrentUserMenu onIdentity={report} />
    </>
  );
}

const meta: Meta<typeof CurrentUserMenu> = {
  title: 'Settings/UserMenu/CurrentUserMenu',
  component: CurrentUserMenu,
  tags: ['autodocs'],
  args: { onIdentity: noop },
  render: ({ onIdentity }) => <ReadingMenu onIdentity={onIdentity} />,
  decorators: [withMemoryRouter('/'), withProfileProvider(loadedProfile())],
  parameters: {
    docs: {
      description: {
        component:
          'The identity source the `current-user` chunk carries. It renders nothing: it reads ' +
          'the signed-in user once through the profile provider and reports the display name ' +
          'and monogram through `onIdentity`, so the one mounted user menu keeps its chip, focus ' +
          'and open state when the chunk arrives. The story feeds a user menu with it: the chip ' +
          'is name-less while the read is pending and shows the name once it succeeds; a failed ' +
          'read reports no identity and leaves the chip name-less and operable.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CurrentUserMenu>;

export const Reading: Story = {};
