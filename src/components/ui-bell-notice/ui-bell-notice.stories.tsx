import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useRef } from 'react';

import type { UIBellNoticeProps } from '@/components/types/ui-bell-notice';
import UIBellNotice from '@/components/ui-bell-notice';
import { StageHeader, StageMain, StagePage } from '@stories/bell-notice-stage';
import { noop } from '@stories/story-callbacks';

type StageProps = Pick<UIBellNoticeProps, 'views'>;

function NoticeStage({ views }: StageProps): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <StagePage>
      <StageHeader bell={bell}>
        <UIBellNotice
          views={views}
          returnFocusRef={save}
          fallbackFocusRef={heading}
          onDismiss={noop}
        />
      </StageHeader>
      <StageMain save={save} heading={heading} />
    </StagePage>
  );
}

const meta: Meta<typeof NoticeStage> = {
  title: 'Components/Feedback/UIBellNotice',
  component: NoticeStage,
  tags: ['autodocs'],
  args: {
    views: {
      items: [
        {
          id: '1',
          kind: 'success',
          message: 'Зміни збережено',
          time: '10 листопада, 09:15',
        },
      ],
    },
  },
  globals: { viewport: { value: 'xl', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The bell notice. From 1440 px it is the merged shape: a 48 wide tab fused with a ' +
          '279 wide card along one left edge, outlined in the neutral edge `#80878A` with four ' +
          '1 px drop shadows whatever the rows say; only the row icons keep their status ' +
          'colour. Below 1440 px it is a caret card, ' +
          '`min(313px, 100vw - 32px)` wide, whose 26 by 6 caret points at the bell centre. ' +
          'Rows show a time and a close button, newest last, at most three. It carries no ' +
          'role, `aria-live` or `aria-atomic`, so the time is never announced, and it stays ' +
          'until the person closes it. Closing moves focus to the next close button, then the ' +
          'previous, then the Save target, then the h1. While shown it sets ' +
          '`--app-top-overhang` on the root element; the bell that owns it sets ' +
          '`--bell-centre-x` and `--bell-bottom`.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NoticeStage>;

const THREE = {
  items: [
    { id: '1', kind: 'success', message: "Ім'я збережено", time: '10 листопада, 09:15' },
    { id: '2', kind: 'success', message: 'Лист надіслано', time: '10 листопада, 09:16' },
    { id: '3', kind: 'success', message: 'Пароль змінено', time: '10 листопада, 09:17' },
  ],
} as const;

export const DesktopOne: Story = {};

export const DesktopThree: Story = { args: { views: THREE } };

export const CaretTablet: Story = {
  args: { views: THREE },
  globals: { viewport: { value: 'lg', isRotated: false } },
};

export const CaretMobile: Story = {
  args: { views: THREE },
  globals: { viewport: { value: 'xs', isRotated: false } },
};

export const Error: Story = {
  args: {
    views: {
      items: [
        { id: '1', kind: 'success', message: "Ім'я збережено", time: '10 листопада, 09:15' },
        {
          id: '2',
          kind: 'error',
          message: 'Не вдалося надіслати лист',
          time: '10 листопада, 09:16',
          action: { label: 'Повторити', onActivate: noop },
        },
      ],
    },
  },
};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A simulation: Storybook cannot switch `prefers-reduced-motion`, so this story removes ' +
          'every animation in its frame. With the real preference the notice appears at once.',
      },
    },
  },
  decorators: [
    (Story): JSX.Element => (
      <Box sx={{ '& *': { animation: 'none !important' } }}>
        <Story />
      </Box>
    ),
  ],
};
