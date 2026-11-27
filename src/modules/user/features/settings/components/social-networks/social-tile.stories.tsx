import type { Meta, StoryObj } from '@storybook/react-webpack5';
import i18next from 'i18next';
import type { JSX } from 'react';

import { ReactComponent as Google } from '@/assets/icons/social/google-color.svg';
import { withStoryList } from '@stories/list-decorators';
import { noop, noopAsync } from '@stories/story-callbacks';
import waitForText from '@stories/wait-for-text';

import type { SocialTileStyle } from '../../types/components/social-tile-style';

import SocialTile from './social-tile';
import BadgeLinkedTile from './social-tile-badge';
import TileLabel from './social-tile-label';
import LabelledLinkedTile from './social-tile-labelled';

import { SocialNetworksCard } from './index';

const DESKTOP_TILE_WIDTH = 304;

const PHONE_TILE_WIDTH = 158;

const TILE_STYLES: readonly SocialTileStyle[] = ['tinted', 'badge', 'labelled'];

const GOOGLE = { provider: 'Google' };

const IN_LIST = { decorators: [withStoryList(DESKTOP_TILE_WIDTH)] };

interface ConfirmationStageArgs {
  readonly tileStyle: SocialTileStyle;
}

function ConfirmationStage({ tileStyle }: ConfirmationStageArgs): JSX.Element {
  return (
    <SocialNetworksCard
      tileStyle={tileStyle}
      links={{
        status: 'ready',
        linked: { items: ['google', 'github'] },
        busy: false,
        link: noopAsync,
        unlink: noopAsync,
        retry: noop,
      }}
    />
  );
}

const openConfirmation = ({ canvasElement }: { canvasElement: HTMLElement }): Promise<void> => {
  const name = i18next.t('settings.social.unlink', GOOGLE);
  const unlink = canvasElement.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`);
  if (unlink === null) throw new Error(`No unlink button named "${name}"`);
  unlink.click();

  return waitForText(canvasElement, i18next.t('settings.social.unlink_question', GOOGLE));
};

const meta: Meta<typeof SocialTile> = {
  title: 'Settings/SocialTile',
  component: SocialTile,
  subcomponents: { TileLabel, BadgeLinkedTile, LabelledLinkedTile },
  tags: ['autodocs'],
  args: {
    tile: { id: 'google', label: 'Google', Icon: Google },
    linked: false,
    busy: false,
    tileStyle: 'tinted',
    onLink: noopAsync,
    onUnlink: noopAsync,
  },
  argTypes: {
    tile: { control: false },
    tileStyle: { control: 'select', options: TILE_STYLES },
  },
  parameters: {
    docs: {
      description: {
        component:
          'One provider of the social networks card. After a link or an unlink the keyboard ' +
          'stays on the tile: its new control takes the focus the old one held. A linked tile ' +
          'is drawn in one of three trial styles, compared here until the product owner picks ' +
          'one; the settings page always renders `tinted`. **Tinted** is the shipped tile ' +
          '(Figma 315:11754): a #E8F7FF fill, a #1EAEFF border and a blue bin. **Badge** keeps ' +
          'the neutral social-button tile (UI kit 439:19329, ' +
          'uicomponents-uibutton--social-button), adds the static UI kit status badge ' +
          '(451:25845, uicomponents-uistatusbadge--static-done) and paints the bin in the ' +
          'action-icon-bar danger lane (632:46703, ' +
          'uicomponents-uiactioniconbar--action-icon-bar). **Labelled** draws the selected-card ' +
          'outline (439:19640, uicomponents-uipaymentoptioncard--selected) with the UI kit ' +
          'secondary pill ' +
          '(439:19257, uicomponents-uibutton--outlined), which reads "Відключити" once its ' +
          "tile's content box is at least 16rem wide and folds to a 44 px bin circle below " +
          'that. Every style has ' +
          'one unlink button named for its provider, aria-disabled while busy, and the same ' +
          'confirmation row, which the ConfirmationOpen stories open.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SocialTile>;

export const NotLinked: Story = { ...IN_LIST };

export const NotLinkedBusy: Story = { ...IN_LIST, args: { busy: true } };

export const Linked: Story = { ...IN_LIST, args: { linked: true } };

export const LinkedBusy: Story = { ...IN_LIST, args: { linked: true, busy: true } };

export const BadgeLinked: Story = { ...IN_LIST, args: { linked: true, tileStyle: 'badge' } };

export const BadgeLinkedBusy: Story = {
  ...IN_LIST,
  args: { linked: true, busy: true, tileStyle: 'badge' },
};

export const LabelledLinked: Story = {
  ...IN_LIST,
  args: { linked: true, tileStyle: 'labelled' },
};

export const LabelledLinkedBusy: Story = {
  ...IN_LIST,
  args: { linked: true, busy: true, tileStyle: 'labelled' },
};

export const LabelledLinkedFolded: Story = {
  ...IN_LIST,
  args: { linked: true, tileStyle: 'labelled' },
  parameters: { listWidth: PHONE_TILE_WIDTH },
};

export const TintedConfirmationOpen: Story = {
  args: { tileStyle: 'tinted' },
  render: ({ tileStyle }) => <ConfirmationStage tileStyle={tileStyle} />,
  play: openConfirmation,
};

export const BadgeConfirmationOpen: Story = {
  args: { tileStyle: 'badge' },
  render: ({ tileStyle }) => <ConfirmationStage tileStyle={tileStyle} />,
  play: openConfirmation,
};

export const LabelledConfirmationOpen: Story = {
  args: { tileStyle: 'labelled' },
  render: ({ tileStyle }) => <ConfirmationStage tileStyle={tileStyle} />,
  play: openConfirmation,
};
