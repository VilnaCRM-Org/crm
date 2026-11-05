import type { Decorator, StoryObj } from '@storybook/react-webpack5';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import 'reflect-metadata';
import type { ComponentProps, JSX } from 'react';

import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import UserProfileSettings from '@/modules/user/features/settings/components/user-profile-settings';
import ProfileProvider from '@/modules/user/features/settings/data-providers/profile-provider';
import { useService } from '@/providers/di';
import { STORY_USER } from '@stories/profile-provider-decorators';
import { elementAt } from '@tests/utils/assert-result';

const STORY_MODULE =
  '@/modules/user/features/settings/components/user-profile-settings/user-profile-settings.stories';

type Decorate = Decorator<ComponentProps<typeof UserProfileSettings>>;

interface Stories {
  readonly Ready: StoryObj<typeof UserProfileSettings>;
}

const storyContext = {} as Parameters<Decorate>[1];

let ready: StoryObj<typeof UserProfileSettings> = {};
let decorators: Decorate[] = [];

const resolved = jest.fn<void, [ProfileProvider]>();

function Probe(): JSX.Element {
  resolved(useService<ProfileProvider>(AUTH_TOKENS.ProfileProvider));

  return <output>probe</output>;
}

function Decorated({ decorate }: { decorate: Decorate }): JSX.Element {
  return decorate(() => <Probe />, storyContext);
}

const providerSeenByTheForm = (): ProfileProvider => elementAt(resolved.mock.calls, 0)[0];

describe('UserProfileSettings Ready story', () => {
  beforeAll(async () => {
    const stories: Stories = await import(STORY_MODULE);
    ready = stories.Ready;
    decorators = [ready.decorators ?? []].flat();
  });

  beforeEach(() => {
    resolved.mockClear();
  });

  it('registers exactly one decorator', () => {
    expect(decorators).toHaveLength(1);
  });

  it('seeds the user the stub answers with', () => {
    expect(ready.args?.user).toEqual(STORY_USER);
  });

  it('hands the form hooks a stub whose read answers the seeded user', async () => {
    render(<Decorated decorate={elementAt(decorators, 0)} />);
    expect(screen.getByText('probe')).toBeInTheDocument();

    const provider = providerSeenByTheForm();
    const { signal } = new AbortController();

    expect(provider).not.toBeInstanceOf(ProfileProvider);
    await expect(provider.read(signal)).resolves.toEqual({ kind: 'ok', user: STORY_USER });
  });

  it('echoes a Save back as saved and answers a resend as sent, off the network', async () => {
    render(<Decorated decorate={elementAt(decorators, 0)} />);

    const provider = providerSeenByTheForm();
    const { signal } = new AbortController();
    const change = { id: STORY_USER.id, currentPassword: 'Demo1234', fullName: 'Марія Коваль' };

    await expect(provider.update(change, signal)).resolves.toEqual({
      kind: 'ok',
      user: { ...STORY_USER, fullName: 'Марія Коваль' },
    });
    await expect(provider.resend(STORY_USER.id, signal)).resolves.toEqual({
      kind: 'sent',
      confirmed: false,
    });
  });

  it('marks a changed e-mail unconfirmed in the echoed user', async () => {
    render(<Decorated decorate={elementAt(decorators, 0)} />);

    const provider = providerSeenByTheForm();
    const { signal } = new AbortController();
    const change = { id: STORY_USER.id, currentPassword: 'Demo1234', email: 'maria@example.com' };

    await expect(provider.update(change, signal)).resolves.toEqual({
      kind: 'ok',
      user: { ...STORY_USER, email: 'maria@example.com', confirmed: false },
    });
  });

  it('restores the registered Data provider when the story unmounts', () => {
    const { unmount } = render(<Decorated decorate={elementAt(decorators, 0)} />);
    const stub = providerSeenByTheForm();

    unmount();

    expect(container.resolve(AUTH_TOKENS.ProfileProvider)).not.toBe(stub);
    expect(container.resolve(AUTH_TOKENS.ProfileProvider)).toBeInstanceOf(ProfileProvider);
  });
});
